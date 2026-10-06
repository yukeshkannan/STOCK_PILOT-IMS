const { SupportTicket, TicketMessage, SupportMember, Tenant, AuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const { getNextSequenceNumber } = require('@stockpilot/common');

let tablesInitialized = false;

class TicketService {
  /**
   * Auto-sync database tables
   */
  async ensureTables() {
    if (tablesInitialized) return;
    try {
      await SupportTicket.sync();
      await TicketMessage.sync();
      await SupportMember.sync();
      tablesInitialized = true;
    } catch (e) {
      console.warn('[Ticket Tables Sync Note]:', e.message);
      try {
        await SupportTicket.sync({ alter: false });
        await TicketMessage.sync({ alter: false });
        await SupportMember.sync({ alter: false });
        tablesInitialized = true;
      } catch (err2) {
        console.warn('[Ticket Tables Fallback Sync Note]:', err2.message);
      }
    }
  }

  /**
   * Create a new support ticket from Tenant Portal with strict auto-increment 0001
   */
  async createTicket(userContext = {}, data = {}) {
    await this.ensureTables();

    const tenantId = Number(userContext.tenantId || userContext.tenant_id) || 1;
    let companyCode = (userContext.companyCode || userContext.company_code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    let companyName = userContext.companyName || userContext.company_name || '';

    if ((!companyCode || !companyName) && tenantId) {
      try {
        const tenantRecord = await Tenant.findByPk(tenantId, {
          attributes: ['id', 'company_code', 'company_name']
        });
        if (tenantRecord) {
          companyCode = companyCode || (tenantRecord.company_code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          companyName = companyName || tenantRecord.company_name;
        }
      } catch (err) {
        console.warn('Tenant lookup note in createTicket:', err.message);
      }
    }
    if (!companyCode) companyCode = 'TKT';
    if (!companyName) companyName = 'Business Organization';

    // Clamp string lengths to fit database column types
    companyCode = companyCode.slice(0, 20);
    companyName = companyName.slice(0, 150);

    const userName = (
      userContext.name ||
      `${userContext.firstName || userContext.first_name || ''} ${userContext.lastName || userContext.last_name || ''}`
    ).trim() || userContext.email || 'Tenant Admin';
    const userEmail = (userContext.email || '').toLowerCase().trim() || 'admin@tenant.io';
    const userPhone = userContext.phone || data.phone || null;

    // Safely parse user_id so it is an integer or null (avoid invalid string for INT in MySQL)
    const rawUserId = userContext.userId || userContext.id;
    const safeUserId = (rawUserId && !isNaN(Number(rawUserId))) ? parseInt(rawUserId, 10) : null;

    // Strict sequential ticket ID: e.g. TKT-ZARA-0001, TKT-ZARA-0002
    const prefix = `TKT-${companyCode}`.slice(0, 25);
    let ticketId;
    try {
      ticketId = await getNextSequenceNumber(sequelize, tenantId, 'SUPPORT_TICKET', prefix, 4);
    } catch (seqErr) {
      console.warn('[Ticket Sequence Warning]:', seqErr.message);
      const count = await SupportTicket.count({ where: { tenant_id: tenantId } }).catch(() => 0);
      ticketId = `${prefix}-${String(count + 1).padStart(4, '0')}`;
    }

    // Helper to safely extract string from either primitives or event/option objects
    const extractString = (val, defaultVal = '') => {
      if (val === null || val === undefined) return defaultVal;
      if (typeof val === 'object') {
        val = val.value !== undefined ? val.value : (val.target?.value !== undefined ? val.target.value : defaultVal);
      }
      return String(val !== undefined && val !== null ? val : defaultVal).trim();
    };

    const cleanCategory = extractString(data.category, 'GENERAL').slice(0, 50);
    const cleanPriority = extractString(data.priority, 'MEDIUM').slice(0, 50);
    const cleanSubject = extractString(data.subject, 'Support Request').slice(0, 255);
    const cleanDescription = extractString(data.description, '');

    const ticket = await SupportTicket.create({
      ticket_id: ticketId,
      tenant_id: tenantId,
      company_name: companyName,
      company_code: companyCode,
      user_id: safeUserId,
      user_name: userName.slice(0, 100),
      user_email: userEmail.slice(0, 150),
      user_phone: userPhone ? String(userPhone).slice(0, 50) : null,
      category: cleanCategory,
      priority: cleanPriority,
      status: 'OPEN',
      subject: cleanSubject,
      description: cleanDescription,
      assigned_to: 'Unassigned'
    });

    // Create Initial Message Thread
    try {
      await TicketMessage.create({
        ticket_id: ticketId,
        sender_type: 'CLIENT',
        sender_name: userName.slice(0, 100),
        sender_email: userEmail.slice(0, 150),
        message: cleanDescription || cleanSubject || 'Support ticket raised',
        is_internal_note: false
      });
    } catch (msgErr) {
      console.error('[Ticket Message Creation Note]:', msgErr.message);
    }

    // Log Audit Trail
    try {
      await AuditLog.create({
        tenant_id: tenantId,
        user_id: safeUserId,
        user_name: userName.slice(0, 100),
        action: 'TICKET_CREATED',
        module: 'SUPPORT',
        record_id: ticketId,
        description: `Support Ticket [${ticketId}] raised: "${ticket.subject}" (Priority: ${ticket.priority})`
      });
    } catch {}

    // Instantly notify Super Admin in notification_db
    try {
      const { createDatabaseConnection } = require('@stockpilot/common');
      const notifDb = createDatabaseConnection('notification_db');
      await notifDb.query(
        `INSERT INTO notifications (tenant_id, user_id, title, message, type, category, action_type, action_id, link, is_read, created_at, updated_at)
         VALUES (0, NULL, :title, :message, 'SUPPORT', 'REQUESTS', 'SUPPORT_TICKET', :ticketId, '/admin/tickets', false, NOW(), NOW())`,
        {
          replacements: {
            title: `New Support Ticket [#${ticketId}] from ${companyName || 'Tenant'}`,
            message: `${userName}: ${cleanSubject} (${cleanPriority})`,
            ticketId: ticketId
          }
        }
      );
    } catch (notifErr) {
      console.warn('[Ticket Service SuperAdmin Notif Note]:', notifErr.message);
    }

    return ticket;
  }

  /**
   * Get all tickets for a specific tenant
   */
  async getTenantTickets(tenantId) {
    await this.ensureTables();

    const tickets = await SupportTicket.findAll({
      where: { tenant_id: Number(tenantId) },
      order: [['updated_at', 'DESC']]
    });

    return tickets;
  }

  /**
   * Get single ticket details and conversation thread
   */
  async getTicketDetails(ticketIdentifier, userContext, isPrivileged = false) {
    await this.ensureTables();

    const whereClause = isPrivileged
      ? { [Op.or]: [{ ticket_id: String(ticketIdentifier) }, { id: Number(ticketIdentifier) || 0 }] }
      : {
          [Op.and]: [
            { [Op.or]: [{ ticket_id: String(ticketIdentifier) }, { id: Number(ticketIdentifier) || 0 }] },
            { tenant_id: Number(userContext.tenantId || userContext.tenant_id) }
          ]
        };

    const ticket = await SupportTicket.findOne({ where: whereClause });
    if (!ticket) {
      throw { statusCode: 404, message: 'Support ticket not found or access denied.' };
    }

    // Filter messages: Client users cannot see internal developer notes.
    // If a developer user (not Super Admin) is viewing, only allow seeing internal notes if assigned to this ticket.
    const messageWhere = { ticket_id: ticket.ticket_id };
    const isSuper = Boolean(userContext?.isSuperAdmin || userContext?.is_super_admin);
    if (!isPrivileged) {
      messageWhere.is_internal_note = false;
    } else if (!isSuper) {
      const isAssigned = this.isUserAssignedToTicket(ticket, userContext);
      if (!isAssigned) {
        messageWhere.is_internal_note = false;
      }
    }

    const messages = await TicketMessage.findAll({
      where: messageWhere,
      order: [['created_at', 'ASC']]
    });

    return {
      ...(typeof ticket.toJSON === 'function' ? ticket.toJSON() : ticket),
      ticket,
      messages
    };
  }

  /**
   * Delete a support ticket and its conversation messages
   */
  async deleteTicket(ticketIdentifier, userContext, isPrivileged = false) {
    await this.ensureTables();

    const whereClause = isPrivileged
      ? { [Op.or]: [{ ticket_id: String(ticketIdentifier) }, { id: Number(ticketIdentifier) || 0 }] }
      : {
          [Op.and]: [
            { [Op.or]: [{ ticket_id: String(ticketIdentifier) }, { id: Number(ticketIdentifier) || 0 }] },
            { tenant_id: Number(userContext.tenantId || userContext.tenant_id) }
          ]
        };

    const ticket = await SupportTicket.findOne({ where: whereClause });
    if (!ticket) {
      throw { statusCode: 404, message: 'Support ticket not found or access denied.' };
    }

    const tktId = ticket.ticket_id;
    await TicketMessage.destroy({ where: { ticket_id: tktId } });
    await ticket.destroy();

    return { success: true, message: `Ticket #${tktId} deleted successfully`, ticket_id: tktId };
  }

  /**
   * Helper: Check if user is SuperAdmin or the developer assigned to the ticket
   */
  isUserAssignedToTicket(ticket, userContext = {}) {
    const isSuperAdmin = Boolean(userContext.isSuperAdmin || userContext.is_super_admin);
    if (isSuperAdmin) return true;

    const assigned = (ticket.assigned_to || '').trim().toLowerCase();
    if (!assigned || assigned === 'unassigned') return false;

    const devName = (userContext.name || `${userContext.firstName || userContext.first_name || ''} ${userContext.lastName || userContext.last_name || ''}`).trim().toLowerCase();
    const devEmail = (userContext.email || '').trim().toLowerCase();

    return Boolean(
      (devName && (assigned === devName || devName.includes(assigned) || assigned.includes(devName))) ||
      (devEmail && (assigned === devEmail || devEmail.includes(assigned) || assigned.includes(devEmail)))
    );
  }

  /**
   * Add a reply or internal developer note
   */
  async addMessage(ticketIdentifier, userContext, messageData, isPrivileged = false) {
    await this.ensureTables();

    const ticketDetails = await this.getTicketDetails(ticketIdentifier, userContext, isPrivileged);
    const ticket = ticketDetails.ticket || ticketDetails;

    // Enforce developer assignment: only assigned developer or SuperAdmin can post messages/notes
    if (isPrivileged && !userContext.isSuperAdmin && !userContext.is_super_admin) {
      if (!this.isUserAssignedToTicket(ticket, userContext)) {
        throw {
          statusCode: 403,
          message: `Access Denied: Ticket [#${ticket.ticket_id}] is assigned to "${ticket.assigned_to || 'Unassigned'}". Only the assigned engineer or Super Admin can post messages or internal notes.`
        };
      }
    }

    const isInternal = Boolean(isPrivileged && messageData.is_internal_note);
    if (isInternal) {
      const assignedDev = (ticket.assigned_to || '').trim();
      if (!assignedDev || assignedDev.toLowerCase() === 'unassigned') {
        throw {
          statusCode: 400,
          message: 'Cannot send internal developer note: No developer is assigned to this ticket. Please assign a developer first.'
        };
      }
    }

    const senderType = isPrivileged
      ? (isInternal ? 'DEVELOPER' : (userContext?.isDeveloper || userContext?.role === 'DEVELOPER' ? 'DEVELOPER' : 'SUPPORT'))
      : 'CLIENT';

    const userName = (messageData.sender_name || userContext.name || `${userContext.firstName || userContext.first_name || ''} ${userContext.lastName || userContext.last_name || ''}`).trim() || userContext.email || (isPrivileged ? 'Support Lead' : (ticket.user_name || 'Tenant Admin'));
    const userEmail = (userContext.email || (isPrivileged ? 'support@stockpilot.io' : (ticket.user_email || 'client@stockpilot.io'))).toLowerCase().trim();

    const newMessage = await TicketMessage.create({
      ticket_id: ticket.ticket_id,
      sender_type: senderType,
      sender_name: userName,
      sender_email: userEmail,
      message: messageData.message?.trim() || '',
      is_internal_note: isInternal
    });

    // Notify assigned developer of the internal note
    if (isInternal) {
      try {
        const { createDatabaseConnection } = require('@stockpilot/common');
        const notifDb = createDatabaseConnection('notification_db');
        await notifDb.query(
          `INSERT INTO notifications (tenant_id, user_id, title, message, type, category, action_type, action_id, link, is_read, created_at, updated_at)
           VALUES (0, NULL, :title, :message, 'SUPPORT', 'REQUESTS', 'INTERNAL_DEV_NOTE', :ticketId, '/dev/workspace', false, NOW(), NOW())`,
          {
            replacements: {
              title: `Internal Note on [#${ticket.ticket_id}] for ${ticket.assigned_to}`,
              message: `${userName}: "${(messageData.message || '').trim().slice(0, 100)}"`,
              ticketId: ticket.ticket_id
            }
          }
        );
      } catch (e) {
        console.warn('[Internal Note Notif Warning]:', e.message);
      }
    }

    // Auto-update ticket status based on communication
    let updatedStatus = ticket.status;
    if (!isInternal) {
      if (isPrivileged) {
        if (ticket.status === 'OPEN') updatedStatus = 'IN_PROGRESS';
        else if (ticket.status === 'IN_PROGRESS') updatedStatus = 'WAITING_CLIENT';
      } else {
        // Client replied
        if (ticket.status === 'WAITING_CLIENT' || ticket.status === 'RESOLVED') {
          updatedStatus = 'IN_PROGRESS';
        }
      }
    }

    await ticket.update({
      status: updatedStatus,
      updated_at: new Date()
    });

    return newMessage;
  }

  /**
   * Super Admin & Developers: Update Ticket Status, Priority, Assignment, Resolution
   */
  async updateTicketStatus(ticketIdentifier, updateData = {}, adminUser = {}) {
    await this.ensureTables();

    const ticket = await SupportTicket.findOne({
      where: { [Op.or]: [{ ticket_id: String(ticketIdentifier) }, { id: Number(ticketIdentifier) || 0 }] }
    });

    if (!ticket) {
      throw { statusCode: 404, message: 'Support ticket not found.' };
    }

    const isSuperAdmin = Boolean(adminUser.isSuperAdmin || adminUser.is_super_admin);

    // Safely extract primitive values even if nested event objects are passed
    const extractVal = (v) => {
      if (v === null || v === undefined) return undefined;
      if (typeof v === 'object') {
        if (v.target && v.target.value !== undefined) return v.target.value;
        if (v.value !== undefined) return v.value;
      }
      return v;
    };

    const statusVal = extractVal(updateData.status);
    const priorityVal = extractVal(updateData.priority);
    const assigneeVal = extractVal(updateData.assigned_to);
    const notesVal = extractVal(updateData.resolution_notes);

    // If caller is developer (not Super Admin), verify they are the assigned developer
    if (!isSuperAdmin) {
      if (assigneeVal !== undefined && assigneeVal !== ticket.assigned_to) {
        throw {
          statusCode: 403,
          message: 'Access Denied: Only Super Admin can assign or reassign tickets to developers.'
        };
      }

      if (!this.isUserAssignedToTicket(ticket, adminUser)) {
        throw {
          statusCode: 403,
          message: `Access Denied: Ticket [#${ticket.ticket_id}] is assigned to "${ticket.assigned_to || 'Unassigned'}". Only the assigned engineer or Super Admin can modify status or resolve it.`
        };
      }
    }

    const previousStatus = ticket.status;
    const previousAssignee = ticket.assigned_to;

    const fieldsToUpdate = {};
    if (statusVal && String(statusVal).trim() !== ticket.status) {
      fieldsToUpdate.status = String(statusVal).trim();
    }
    if (priorityVal) {
      fieldsToUpdate.priority = String(priorityVal).trim();
    }
    if (assigneeVal !== undefined) {
      fieldsToUpdate.assigned_to = String(assigneeVal).trim();
    }
    if (notesVal !== undefined) {
      fieldsToUpdate.resolution_notes = String(notesVal);
    }

    if (Object.keys(fieldsToUpdate).length > 0) {
      fieldsToUpdate.updated_at = new Date();
      await ticket.update(fieldsToUpdate);
    }

    const adminName = adminUser?.name || adminUser?.email || 'Super Admin';
    const adminEmail = adminUser?.email || 'system@stockpilot.io';

    // System Message on status change
    if (fieldsToUpdate.status && fieldsToUpdate.status !== previousStatus) {
      try {
        await TicketMessage.create({
          ticket_id: ticket.ticket_id,
          sender_type: 'SYSTEM',
          sender_name: 'StockPilot System',
          sender_email: adminEmail,
          message: `Ticket status updated from [${previousStatus}] to [${fieldsToUpdate.status}] by ${adminName}`,
          is_internal_note: false
        });
      } catch (e) {
        console.warn('System status msg error:', e.message);
      }
    }

    // System Message on assignee change
    if (fieldsToUpdate.assigned_to && fieldsToUpdate.assigned_to !== previousAssignee) {
      try {
        await TicketMessage.create({
          ticket_id: ticket.ticket_id,
          sender_type: 'SYSTEM',
          sender_name: 'StockPilot System',
          sender_email: adminEmail,
          message: `Ticket assigned to [${fieldsToUpdate.assigned_to}]`,
          is_internal_note: true
        });
      } catch (e) {
        console.warn('System assign msg error:', e.message);
      }
    }

    return ticket;
  }

  /**
   * Super Admin: Fetch all platform tickets with rich filters
   */
  async getAdminTickets(filters = {}) {
    await this.ensureTables();

    const where = {};
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters.priority && filters.priority !== 'ALL') {
      where.priority = filters.priority;
    }
    if (filters.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }
    if (filters.assigned_to && filters.assigned_to !== 'ALL') {
      where.assigned_to = filters.assigned_to;
    }
    if (filters.search) {
      const q = `%${filters.search.trim()}%`;
      where[Op.or] = [
        { ticket_id: { [Op.like]: q } },
        { company_name: { [Op.like]: q } },
        { company_code: { [Op.like]: q } },
        { subject: { [Op.like]: q } },
        { user_email: { [Op.like]: q } }
      ];
    }

    const tickets = await SupportTicket.findAll({
      where,
      order: [
        sequelize.literal(`CASE 
          WHEN priority = 'CRITICAL_BLOCKER' OR priority = 'CRITICAL' THEN 1 
          WHEN priority = 'HIGH' THEN 2 
          WHEN priority = 'MEDIUM' THEN 3 
          ELSE 4 END`),
        ['updated_at', 'DESC']
      ]
    });

    return tickets;
  }

  /**
   * Super Admin: Get Ticket Metrics & SLA Overview
   */
  async getAdminStats() {
    await this.ensureTables();

    const [total, open, inProgress, critical, resolved] = await Promise.all([
      SupportTicket.count(),
      SupportTicket.count({ where: { status: 'OPEN' } }),
      SupportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      SupportTicket.count({
        where: {
          priority: { [Op.in]: ['CRITICAL', 'CRITICAL_BLOCKER'] },
          status: { [Op.ne]: 'CLOSED' }
        }
      }),
      SupportTicket.count({ where: { status: { [Op.in]: ['RESOLVED', 'CLOSED'] } } })
    ]);

    return {
      total,
      open,
      inProgress,
      critical,
      resolved
    };
  }

  /**
   * Support Team / Developer Management
   */
  async getSupportTeam() {
    await this.ensureTables();
    return await SupportMember.findAll({
      order: [['status', 'ASC'], ['name', 'ASC']]
    });
  }

  async addSupportMember(data) {
    await this.ensureTables();
    if (!data.name || !data.email) {
      throw { statusCode: 400, message: 'Developer/Member Name and Email are required.' };
    }
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await SupportMember.findOne({ where: { email: cleanEmail } });
    if (existing) {
      throw { statusCode: 409, message: `A developer with email [${cleanEmail}] already exists.` };
    }

    const bcrypt = require('bcryptjs');
    const rawPassword = (data.password && data.password.trim()) || 'dev123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    const member = await SupportMember.create({
      name: data.name.trim(),
      email: cleanEmail,
      role: data.role?.trim() || 'Core Developer',
      specialization: data.specialization?.trim() || 'Full Stack & APIs',
      phone: data.phone?.trim() || null,
      password: hashedPassword,
      status: data.status || 'ACTIVE'
    });
    return member;
  }

  async updateSupportMember(id, data) {
    await this.ensureTables();
    const member = await SupportMember.findByPk(id);
    if (!member) {
      throw { statusCode: 404, message: 'Support member not found.' };
    }

    const updateFields = {};
    if (data.name !== undefined) updateFields.name = data.name.trim();
    if (data.email !== undefined) updateFields.email = data.email.trim().toLowerCase();
    if (data.role !== undefined) updateFields.role = data.role.trim();
    if (data.specialization !== undefined) updateFields.specialization = data.specialization.trim();
    if (data.phone !== undefined) updateFields.phone = data.phone.trim();
    if (data.status !== undefined) updateFields.status = data.status;

    if (data.password && data.password.trim().length >= 4) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(data.password.trim(), salt);
    }

    await member.update(updateFields);
    return member;
  }

  async deleteSupportMember(id) {
    await this.ensureTables();
    const member = await SupportMember.findByPk(id);
    if (!member) {
      throw { statusCode: 404, message: 'Support member not found.' };
    }
    await member.destroy();
    return { success: true, message: `Member [${member.name}] removed successfully.` };
  }
}

module.exports = new TicketService();
