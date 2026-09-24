const { ApiResponse } = require('@stockpilot/common');
const ticketService = require('../services/ticketService');

class TicketController {
  /**
   * Tenant: Raise new support ticket
   */
  async createTicket(req, res, next) {
    try {
      const ticket = await ticketService.createTicket(req.user, req.body);
      return ApiResponse.created(res, ticket, `Support ticket [${ticket.ticket_id}] raised successfully`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant: List own raised tickets
   */
  async getMyTickets(req, res, next) {
    try {
      const tenantId = req.user.tenantId || req.user.tenant_id;
      const tickets = await ticketService.getTenantTickets(tenantId);
      return ApiResponse.success(res, tickets, 'Tenant support tickets');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant & Admin: Get single ticket details and conversation thread
   */
  async getTicketDetails(req, res, next) {
    try {
      const isPrivileged = Boolean(
        req.user?.isSuperAdmin ||
        req.user?.is_super_admin ||
        req.user?.isDeveloper ||
        req.user?.role === 'DEVELOPER' ||
        req.user?.roleName === 'DEVELOPER'
      );
      const data = await ticketService.getTicketDetails(req.params.id, req.user, isPrivileged);
      return ApiResponse.success(res, data, 'Ticket details and messages');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant & Admin: Add reply or internal note
   */
  async addMessage(req, res, next) {
    try {
      const isPrivileged = Boolean(
        req.user?.isSuperAdmin ||
        req.user?.is_super_admin ||
        req.user?.isDeveloper ||
        req.user?.role === 'DEVELOPER' ||
        req.user?.roleName === 'DEVELOPER'
      );
      const message = await ticketService.addMessage(req.params.id, req.user, req.body, isPrivileged);
      return ApiResponse.created(res, message, 'Message added to ticket conversation');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Super Admin: List all platform tickets
   */
  async adminListTickets(req, res, next) {
    try {
      const tickets = await ticketService.getAdminTickets(req.query);
      return ApiResponse.success(res, tickets, 'All platform support tickets');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Super Admin: Update ticket status, priority, or developer assignment
   */
  async adminUpdateTicket(req, res, next) {
    try {
      const ticket = await ticketService.updateTicketStatus(req.params.id, req.body, req.user);
      return ApiResponse.success(res, ticket, `Ticket [${ticket.ticket_id}] updated successfully`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Tenant & Admin: Delete support ticket and thread
   */
  async deleteTicket(req, res, next) {
    try {
      const isPrivileged = Boolean(
        req.user?.isSuperAdmin ||
        req.user?.is_super_admin ||
        req.user?.isDeveloper ||
        req.user?.role === 'DEVELOPER' ||
        req.user?.roleName === 'DEVELOPER'
      );
      const result = await ticketService.deleteTicket(req.params.id, req.user, isPrivileged);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Super Admin: Get Ticket Command Center Stats
   */
  async adminGetStats(req, res, next) {
    try {
      const stats = await ticketService.getAdminStats();
      return ApiResponse.success(res, stats, 'Ticket metrics');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Super Admin: Support Team / Developer Management
   */
  async adminGetTeam(req, res, next) {
    try {
      const team = await ticketService.getSupportTeam();
      return ApiResponse.success(res, team, 'Support team members');
    } catch (err) {
      next(err);
    }
  }

  async adminAddTeamMember(req, res, next) {
    try {
      const member = await ticketService.addSupportMember(req.body);
      return ApiResponse.created(res, member, `Member [${member.name}] added to support team`);
    } catch (err) {
      next(err);
    }
  }

  async adminUpdateTeamMember(req, res, next) {
    try {
      const member = await ticketService.updateSupportMember(req.params.id, req.body);
      return ApiResponse.success(res, member, `Member [${member.name}] updated successfully`);
    } catch (err) {
      next(err);
    }
  }

  async adminDeleteTeamMember(req, res, next) {
    try {
      const result = await ticketService.deleteSupportMember(req.params.id);
      return ApiResponse.success(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TicketController();
