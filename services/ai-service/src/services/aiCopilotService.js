const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env'), override: true });

const imsTools = require('../tools/imsTools');

// Tool definitions for Google Gemini
const geminiToolDeclarations = [
  {
    functionDeclarations: [
      {
        name: 'getWarehouses',
        description: 'Get all warehouses, active warehouse count, locations, managers, and storage capacity for this organization.',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'Filter by status: ACTIVE, INACTIVE, or ALL'
            },
            search: {
              type: 'string',
              description: 'Optional warehouse name or city to search'
            }
          }
        }
      },
      {
        name: 'getStockOverview',
        description: 'Get live inventory stock levels, low stock warnings, and out of stock items for this business.',
        parameters: {
          type: 'object',
          properties: {
            lowStockOnly: {
              type: 'boolean',
              description: 'Set to true to only retrieve products that are running low or out of stock'
            },
            search: {
              type: 'string',
              description: 'Optional product name or code to filter by'
            }
          }
        }
      },
      {
        name: 'getSalesSummary',
        description: 'Get sales performance, revenue, orders count, and recent invoices for a specified period (today, yesterday, this_week, this_month, all).',
        parameters: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              description: 'Time period: today, yesterday, this_week, this_month, or all'
            }
          }
        }
      },
      {
        name: 'getFinancialSnapshot',
        description: 'Get month-to-date financial overview including revenue receipts, total business expenses, and net cashflow.',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'searchProducts',
        description: 'Search or list products in this business by name or product code to check prices, GST rate, and status.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Optional search keyword (product name or SKU/code). Leave empty to list all products.'
            }
          }
        }
      },
      {
        name: 'createSupportTicket',
        description: 'Submit an official support or technical issue ticket when the user encounters a bug, printer failure, or needs developer assistance.',
        parameters: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Short summary of the problem or request'
            },
            description: {
              type: 'string',
              description: 'Detailed explanation of what went wrong'
            },
            priority: {
              type: 'string',
              description: 'Priority level: LOW, MEDIUM, HIGH, or URGENT'
            },
            category: {
              type: 'string',
              description: 'Category: TECHNICAL, BILLING, INVENTORY, HARDWARE, or GENERAL'
            }
          },
          required: ['subject', 'description']
        }
      }
    ]
  }
];

// Tool definitions for Groq (OpenAI Compatible)
const groqTools = [
  {
    type: 'function',
    function: {
      name: 'getWarehouses',
      description: 'Get all warehouses, active warehouse count, locations, managers, and storage capacity for this organization.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Filter by status: ACTIVE, INACTIVE, or ALL'
          },
          search: {
            type: 'string',
            description: 'Optional warehouse name or city to search'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getStockOverview',
      description: 'Get live inventory stock levels, low stock warnings, and out of stock items for this business.',
      parameters: {
        type: 'object',
        properties: {
          lowStockOnly: {
            type: 'boolean',
            description: 'Set to true to only retrieve products that are running low or out of stock'
          },
          search: {
            type: 'string',
            description: 'Optional product name or code to filter by'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getSalesSummary',
      description: 'Get sales performance, revenue, orders count, and recent invoices for a specified period (today, yesterday, this_week, this_month, all).',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: 'Time period: today, yesterday, this_week, this_month, or all'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getFinancialSnapshot',
      description: 'Get month-to-date financial overview including revenue receipts, total business expenses, and net cashflow.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'searchProducts',
      description: 'Search or list products in this business by name or product code to check prices, GST rate, and status.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Optional search keyword (product name or SKU/code). Leave empty to list all products.'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'createSupportTicket',
      description: 'Submit an official support or technical issue ticket when the user encounters a bug, printer failure, or needs developer assistance.',
      parameters: {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
            description: 'Short summary of the problem or request'
          },
          description: {
            type: 'string',
            description: 'Detailed explanation of what went wrong'
          },
          priority: {
            type: 'string',
            description: 'Priority level: LOW, MEDIUM, HIGH, or URGENT'
          },
          category: {
            type: 'string',
            description: 'Category: TECHNICAL, BILLING, INVENTORY, HARDWARE, or GENERAL'
          }
        },
        required: ['subject', 'description']
      }
    }
  }
];

class AiCopilotService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.groqModel = 'openai/gpt-oss-120b';
    this.geminiModel = 'gemini-1.5-flash';
  }

  getSystemInstruction(companyName = 'StockPilot Tenant', userName = 'User') {
    return `You are StockPilot Copilot, the high-precision AI business partner embedded inside the StockPilot Inventory Management System (IMS) for "${companyName}".
You assist "${userName}" (the store owner, manager, or staff) with day-to-day inventory management, warehouses, real-time sales reporting, price checks, financial health analysis, and business assistance.

KEY PERSONALITY & RULES:
1. Professional Tone & Clean Formatting:
   - Do NOT use emojis or icon glyphs in any of your responses. Keep responses strictly clean, corporate, and executive.
   - Always greet with "Hey ${userName}!" (Do not use "Vanakkam" and do not use waving hand emojis).
   - Do NOT use raw '#' heading symbols like '###'. Instead, use bold text (e.g. **Section Title**) for clean readability.
2. Multilingual Fluency:
   - Understand queries in English, Tamil, and Tanglish (e.g. "macha enna items low stock la iruku", "ethana warehouse active ah iruku?").
   - If asked in Tanglish, reply in clean, professional Tanglish + crisp English data tables/metrics without emojis. If asked in English, reply in crisp English.
3. Structured Data:
   - Use clean Markdown tables for item lists and warehouse lists.
   - Use bold numbers, clear bullet points, and clean currency formatting with ₹ (INR).
4. Tool Execution:
   - ALWAYS use the provided tools (getWarehouses, getStockOverview, getSalesSummary, getFinancialSnapshot, searchProducts, createSupportTicket) whenever real data or metrics are requested.`;
  }

  async processChat({ tenantId, userId, userName, companyName, message, history = [] }) {
    const groqKey = process.env.GROQ_API_KEY || this.groqApiKey;
    const geminiKey = process.env.GEMINI_API_KEY || this.geminiApiKey;

    // 1. Try Groq LPU Cloud (Primary - Ultra Fast)
    if (groqKey) {
      try {
        console.log('[AI Copilot] Processing via Groq AI Cloud...');
        return await this.processChatWithGroq({
          apiKey: groqKey,
          tenantId,
          userId,
          userName,
          companyName,
          message,
          history
        });
      } catch (err) {
        console.warn('[AI Copilot] Groq error, attempting secondary fallback:', err.message);
      }
    }

    // 2. Try Gemini API (Secondary)
    if (geminiKey) {
      try {
        console.log('[AI Copilot] Processing via Gemini API...');
        return await this.processChatWithGemini({
          apiKey: geminiKey,
          tenantId,
          userId,
          userName,
          companyName,
          message,
          history
        });
      } catch (err) {
        console.warn('[AI Copilot] Gemini error, attempting Smart Local fallback:', err.message);
      }
    }

    // 3. Resilient Local Smart Rule Engine (Direct PostgreSQL queries)
    console.log('[AI Copilot] Running on Smart Local Database Engine...');
    return await this.executeSmartLocalEngine({ tenantId, userId, userName, companyName, message });
  }

  /**
   * ⚡ Groq Cloud AI Engine with Function / Tool Calling
   */
  async processChatWithGroq({ apiKey, tenantId, userId, userName, companyName, message, history = [] }) {
    const messages = [
      { role: 'system', content: this.getSystemInstruction(companyName, userName) }
    ];

    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.sender === 'user' && item.text) {
          messages.push({ role: 'user', content: item.text });
        } else if (item.sender === 'bot' && item.text) {
          messages.push({ role: 'assistant', content: item.text });
        }
      }
    }

    messages.push({ role: 'user', content: message });

    const executedActions = [];
    let iterations = 0;
    let finalReply = '';

    while (iterations < 4) {
      iterations++;

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.groqModel,
          messages,
          tools: groqTools,
          tool_choice: 'auto',
          temperature: 0.2
        })
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error?.message || `Groq API returned status ${res.status}`);
      }

      const choice = data?.choices?.[0];
      const assistantMsg = choice?.message;

      if (!assistantMsg) {
        throw new Error('No assistant message returned from Groq');
      }

      messages.push(assistantMsg);

      // Check if Groq requested tool calls
      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        for (const toolCall of assistantMsg.tool_calls) {
          const name = toolCall.function.name;
          let args = {};
          try {
            args = JSON.parse(toolCall.function.arguments || '{}');
          } catch (e) {
            args = {};
          }

          console.log(`[Groq Tool Call] ${name}:`, JSON.stringify(args));
          const toolResult = await this.executeTool(name, args, tenantId, userId);
          
          if (name === 'getWarehouses') executedActions.push({ type: 'WAREHOUSE_LOOKUP', data: toolResult });
          else if (name === 'getStockOverview') executedActions.push({ type: 'STOCK_CHECK', data: toolResult });
          else if (name === 'getSalesSummary') executedActions.push({ type: 'SALES_ANALYTICS', data: toolResult });
          else if (name === 'getFinancialSnapshot') executedActions.push({ type: 'FINANCE_SNAPSHOT', data: toolResult });
          else if (name === 'searchProducts') executedActions.push({ type: 'PRODUCT_SEARCH', data: toolResult });
          else if (name === 'createSupportTicket') executedActions.push({ type: 'TICKET_CREATED', data: toolResult });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: name,
            content: JSON.stringify(toolResult)
          });
        }
      } else {
        // Final assistant answer received
        finalReply = assistantMsg.content || '';
        break;
      }
    }

    if (!finalReply) {
      // If loop ended without explicit reply, formulate fallback
      finalReply = `I have updated and fetched the live records for your business operations.`;
    }

    return {
      reply: this.sanitizeText(finalReply),
      actions: executedActions
    };
  }

  /**
   * 🤖 Google Gemini AI Engine
   */
  async processChatWithGemini({ apiKey, tenantId, userId, userName, companyName, message, history = [] }) {
    const contents = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.sender === 'user' && item.text) {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'bot' && item.text) {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents,
      systemInstruction: {
        parts: [{ text: this.getSystemInstruction(companyName, userName) }]
      },
      tools: geminiToolDeclarations
    };

    let res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    let data = await res.json();
    if (!res.ok || data?.error || !data?.candidates?.[0]?.content?.parts) {
      throw new Error(data?.error?.message || `Gemini API returned status ${res.status}`);
    }

    const executedActions = [];
    let lastToolResult = null;
    let iterations = 0;

    while (iterations < 4 && data?.candidates?.[0]?.content?.parts) {
      iterations++;
      const parts = data.candidates[0].content.parts;
      const functionCallPart = parts.find((p) => p.functionCall);

      if (!functionCallPart) break;

      const { name, args, id } = functionCallPart.functionCall;
      console.log(`[Gemini Tool Call] ${name}:`, JSON.stringify(args));

      const toolResult = await this.executeTool(name, args, tenantId, userId);

      if (name === 'getWarehouses') executedActions.push({ type: 'WAREHOUSE_LOOKUP', data: toolResult });
      else if (name === 'getStockOverview') executedActions.push({ type: 'STOCK_CHECK', data: toolResult });
      else if (name === 'getSalesSummary') executedActions.push({ type: 'SALES_ANALYTICS', data: toolResult });
      else if (name === 'getFinancialSnapshot') executedActions.push({ type: 'FINANCE_SNAPSHOT', data: toolResult });
      else if (name === 'searchProducts') executedActions.push({ type: 'PRODUCT_SEARCH', data: toolResult });
      else if (name === 'createSupportTicket') executedActions.push({ type: 'TICKET_CREATED', data: toolResult });

      lastToolResult = { name, data: toolResult };

      contents.push(data.candidates[0].content);

      const funcRespObj = { name, response: toolResult };
      if (id) funcRespObj.id = id;

      contents.push({
        role: 'user',
        parts: [{ functionResponse: funcRespObj }]
      });

      res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: this.getSystemInstruction(companyName, userName) }]
          },
          tools: geminiToolDeclarations
        })
      });

      data = await res.json();
    }

    let replyText = '';
    if (data?.candidates?.[0]?.content?.parts) {
      replyText = data.candidates[0].content.parts
        .filter((p) => p && typeof p.text === 'string')
        .map((p) => p.text)
        .join('\n')
        .trim();
    }

    if (!replyText && lastToolResult) {
      replyText = this.formatToolResultFallback(lastToolResult.name, lastToolResult.data, companyName, userName);
    }

    if (!replyText) {
      throw new Error('Empty Gemini model reply text');
    }

    return {
      reply: this.sanitizeText(replyText),
      actions: executedActions
    };
  }

  async executeTool(name, args, tenantId, userId) {
    if (name === 'getWarehouses') {
      return await imsTools.getWarehouses(tenantId, args);
    } else if (name === 'getStockOverview') {
      return await imsTools.getStockOverview(tenantId, args);
    } else if (name === 'getSalesSummary') {
      return await imsTools.getSalesSummary(tenantId, args);
    } else if (name === 'getFinancialSnapshot') {
      return await imsTools.getFinancialSnapshot(tenantId);
    } else if (name === 'searchProducts') {
      return await imsTools.searchProducts(tenantId, args);
    } else if (name === 'createSupportTicket') {
      return await imsTools.createSupportTicket(tenantId, userId, args);
    }
    return { error: `Tool ${name} is unknown` };
  }

  sanitizeText(str = '') {
    return str
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/^###\s*/gm, '**')
      .replace(/^##\s*/gm, '**')
      .replace(/^#\s*/gm, '**')
      .replace(/\s*--\s*$/gm, '**')
      .trim();
  }

  formatToolResultFallback(toolName, data, companyName, userName) {
    if (toolName === 'getWarehouses') {
      let text = `**Warehouse Overview for ${companyName}**\n\n` +
        `* Total Warehouses: **${data.totalCount || 0}**\n` +
        `* Active Warehouses: **${data.activeCount || 0}**\n` +
        `* Inactive Warehouses: **${data.inactiveCount || 0}**\n\n`;
      if (data.warehouses && data.warehouses.length > 0) {
        text += `| Code | Warehouse Name | Location / City | Manager | Capacity | Status |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        data.warehouses.forEach((w) => {
          const status = w.status === 'ACTIVE' ? 'Active' : 'Inactive';
          text += `| \`${w.code}\` | **${w.name}** | ${w.city} | ${w.manager} | ${w.capacity} | ${status} |\n`;
        });
      } else {
        text += `No warehouses registered yet for this organization.`;
      }
      return text;
    }

    if (toolName === 'getStockOverview') {
      let text = `**Live Inventory Stock Overview**\n\n` +
        `* Total Tracked Items: **${data.stats?.totalItems || 0}**\n` +
        `* Low Stock Warning: **${data.stats?.lowStockCount || 0} items**\n` +
        `* Out of Stock: **${data.stats?.outOfStockCount || 0} items**\n` +
        `* Total In-Stock Units: **${Number(data.stats?.totalUnits || 0).toLocaleString()} units**\n\n`;
      if (data.items && data.items.length > 0) {
        text += `| Product Code | Item Name | Warehouse | Current Units | Minimum | Status |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        data.items.forEach((item) => {
          const status = item.isOutOfStock ? 'Out of Stock' : (item.isLowStock ? 'Low Stock' : 'Healthy');
          text += `| \`${item.code}\` | **${item.name}** | ${item.warehouse || 'Central'} | ${item.currentStock} | ${item.minStock} | ${status} |\n`;
        });
      } else {
        text += `All stock levels are currently healthy and well-stocked.`;
      }
      return text;
    }

    if (toolName === 'getSalesSummary') {
      return `**Real-Time Sales Summary**\n\n` +
        `* Total Orders Completed: **${data.summary?.totalOrders || 0}**\n` +
        `* Gross Revenue: **₹${Number(data.summary?.totalRevenue || 0).toLocaleString()}**\n` +
        `* Cash Collected: **₹${Number(data.summary?.totalCollected || 0).toLocaleString()}**\n` +
        `* Pending Receivables: **₹${Number(data.summary?.pendingReceivables || 0).toLocaleString()}**\n` +
        `* Average Ticket Size: **₹${Number(data.summary?.avgOrderValue || 0).toLocaleString()}**\n\n` +
        `Note: Head over to Sales & Invoices module for customer receipts and order breakdown.`;
    }

    if (toolName === 'searchProducts') {
      let text = `**Products Catalog (${data.totalRegisteredProducts || data.count || 0} items)**\n\n`;
      if (data.products && data.products.length > 0) {
        text += `| Code | Product Name | Selling Price | Purchase Price | Status |\n| :--- | :--- | :--- | :--- | :--- |\n`;
        data.products.forEach((p) => {
          text += `| \`${p.code}\` | **${p.name}** | ${p.price} | ${p.purchasePrice} | ${p.status} |\n`;
        });
      } else {
        text += `No matching products found in your inventory.`;
      }
      return text;
    }

    if (toolName === 'getFinancialSnapshot') {
      return `**Financial Health Snapshot (Month-to-Date)**\n\n` +
        `* Total Revenue Inflow: **₹${Number(data.monthToDate?.totalReceiptsCollected || 0).toLocaleString()}**\n` +
        `* Total Expenses & Bills: **₹${Number(data.monthToDate?.totalExpenses || 0).toLocaleString()}**\n` +
        `* Total Supplier Payouts: **₹${Number(data.monthToDate?.totalPayouts || 0).toLocaleString()}**\n` +
        `* Net Business Balance: **₹${Number(data.monthToDate?.netCashflow || 0).toLocaleString()}**\n\n` +
        `Note: Financial metrics are positive. Detailed ledgers are available in the Finance module.`;
    }

    return `I have fetched the latest live data for your business operations.`;
  }

  /**
   * 🛡️ Smart Local Fallback Database Engine
   */
  async executeSmartLocalEngine({ tenantId, userId, userName, companyName, message }) {
    const lower = (message || '').toLowerCase();
    const executedActions = [];
    let reply = '';

    // 1. Warehouse Lookups
    if (lower.includes('warehouse') || lower.includes('warehouses') || lower.includes('location') || lower.includes('hub') || lower.includes('கிடங்கு')) {
      const whData = await imsTools.getWarehouses(tenantId, { status: lower.includes('inactive') ? 'INACTIVE' : (lower.includes('active') ? 'ACTIVE' : 'ALL') });
      executedActions.push({ type: 'WAREHOUSE_LOOKUP', data: whData });

      reply = `**Warehouse Overview for ${companyName}**\n\n` +
        `* Total Registered Warehouses: **${whData.totalCount}**\n` +
        `* Active Warehouses: **${whData.activeCount}**\n` +
        `* Inactive Warehouses: **${whData.inactiveCount}**\n\n`;

      if (whData.warehouses && whData.warehouses.length > 0) {
        reply += `| Code | Warehouse Name | City | Manager | Capacity | Status |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        whData.warehouses.forEach((w) => {
          const statusLabel = w.status === 'ACTIVE' ? 'Active' : 'Inactive';
          reply += `| \`${w.code}\` | **${w.name}** | ${w.city} | ${w.manager} | ${w.capacity} | ${statusLabel} |\n`;
        });
      } else {
        reply += `No warehouses registered yet for this organization. You can create warehouses from the Warehouse Management page.`;
      }
    }
    // 2. Stock / Inventory Checks
    else if (lower.includes('stock') || lower.includes('inventory') || lower.includes('low') || lower.includes('out of stock') || lower.includes('reorder') || lower.includes('குறைவு') || lower.includes('கையிருப்பு')) {
      const isLowOnly = lower.includes('low') || lower.includes('out') || lower.includes('reorder') || lower.includes('குறைவு');
      const stockData = await imsTools.getStockOverview(tenantId, { lowStockOnly: isLowOnly });
      executedActions.push({ type: 'STOCK_CHECK', data: stockData });

      reply = `**Live Inventory Stock Overview**\n\n` +
        `* Total Tracked Items: **${stockData.stats.totalItems}**\n` +
        `* Low Stock Warning: **${stockData.stats.lowStockCount} items**\n` +
        `* Out of Stock: **${stockData.stats.outOfStockCount} items**\n` +
        `* Total Stock Units: **${stockData.stats.totalUnits.toLocaleString()} units**\n\n`;

      if (stockData.items && stockData.items.length > 0) {
        reply += `| Product Code | Item Name | Warehouse | Current Units | Minimum | Status |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        stockData.items.forEach((item) => {
          const status = item.isOutOfStock ? 'Out of Stock' : (item.isLowStock ? 'Low Stock' : 'Healthy');
          reply += `| \`${item.code}\` | **${item.name}** | ${item.warehouse || 'Central Hub'} | **${item.currentStock}** | ${item.minStock} | ${status} |\n`;
        });
      } else {
        reply += `All products currently have healthy stock levels above minimum thresholds.`;
      }
      reply += `\n\nTip: Use Stock Adjustment or Purchase Orders to replenish inventory.`;
    }
    // 3. Sales & Orders
    else if (lower.includes('sale') || lower.includes('sales') || lower.includes('revenue') || lower.includes('order') || lower.includes('billing') || lower.includes('invoice') || lower.includes('விற்பனை')) {
      const period = lower.includes('yesterday') ? 'yesterday' : (lower.includes('month') ? 'this_month' : (lower.includes('week') ? 'this_week' : 'today'));
      const salesData = await imsTools.getSalesSummary(tenantId, { period });
      executedActions.push({ type: 'SALES_ANALYTICS', data: salesData });

      const periodLabel = period === 'today' ? "Today's" : (period === 'yesterday' ? "Yesterday's" : (period === 'this_month' ? "This Month's" : "This Week's"));

      reply = `**Real-Time ${periodLabel} Sales Summary**\n\n` +
        `* Total Orders Completed: **${salesData.summary.totalOrders}**\n` +
        `* Gross Revenue: **₹${Number(salesData.summary.totalRevenue).toLocaleString()}**\n` +
        `* Cash Collected: **₹${Number(salesData.summary.totalCollected).toLocaleString()}**\n` +
        `* Pending Receivables: **₹${Number(salesData.summary.pendingReceivables).toLocaleString()}**\n` +
        `* Average Ticket Size: **₹${Number(salesData.summary.avgOrderValue).toLocaleString()}**\n\n`;

      if (salesData.recentOrders && salesData.recentOrders.length > 0) {
        reply += `Recent Invoices:\n`;
        reply += `| Invoice # | Customer | Amount | Mode | Status |\n| :--- | :--- | :--- | :--- | :--- |\n`;
        salesData.recentOrders.forEach((o) => {
          reply += `| \`${o.invoice_number}\` | ${o.customer_name || 'Walk-in'} | **₹${Number(o.grand_total).toLocaleString()}** | ${o.payment_method} | ${o.payment_status} |\n`;
        });
      }
      reply += `\nTip: You can view the full invoices ledger in the Sales module.`;
    }
    // 4. Products & Catalog
    else if (lower.includes('product') || lower.includes('products') || lower.includes('item') || lower.includes('items') || lower.includes('price') || lower.includes('catalog') || lower.includes('sku') || lower.includes('பொருள்')) {
      const prodData = await imsTools.searchProducts(tenantId, { query: '', limit: 15 });
      executedActions.push({ type: 'PRODUCT_SEARCH', data: prodData });

      reply = `**Products Catalog for ${companyName} (${prodData.totalRegisteredProducts || prodData.count} items)**\n\n`;

      if (prodData.products && prodData.products.length > 0) {
        reply += `| Product Code | Item Name | Selling Price | Purchase Price | Unit | Status |\n| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        prodData.products.forEach((p) => {
          reply += `| \`${p.code}\` | **${p.name}** | **${p.price}** | ${p.purchasePrice} | ${p.unit} | ${p.status} |\n`;
        });
      } else {
        reply += `No products registered yet. Head over to the Products page to add your catalog.`;
      }
    }
    // 5. Finance & Profit
    else if (lower.includes('finance') || lower.includes('expense') || lower.includes('profit') || lower.includes('cashflow') || lower.includes('loss') || lower.includes('health') || lower.includes('நிதி')) {
      const finData = await imsTools.getFinancialSnapshot(tenantId);
      executedActions.push({ type: 'FINANCE_SNAPSHOT', data: finData });

      reply = `**Financial Health Snapshot (Month-to-Date)**\n\n` +
        `* Total Revenue Inflow: **₹${Number(finData.monthToDate.totalReceiptsCollected).toLocaleString()}**\n` +
        `* Total Expenses & Bills: **₹${Number(finData.monthToDate.totalExpenses).toLocaleString()}**\n` +
        `* Total Supplier Payouts: **₹${Number(finData.monthToDate.totalPayouts).toLocaleString()}**\n` +
        `* Net Business Balance: **₹${Number(finData.monthToDate.netCashflow).toLocaleString()}**\n\n` +
        `Note: Detailed ledgers and charts are available in the Finance module.`;
    }
    // 6. Greetings & General Chat
    else if (lower.includes('hi') || lower.includes('hii') || lower.includes('hello') || lower.includes('hey') || lower.includes('vanakkam') || lower.includes('வணக்கம்')) {
      reply = `Hey **${userName}**! Welcome to **${companyName}** Copilot.\n\n` +
        `I am your intelligent business assistant. Here is what you can ask me:\n\n` +
        `* "Which products are low on stock right now?"\n` +
        `* "Show me today's sales summary and total revenue"\n` +
        `* "How many active warehouses in my organization?"\n` +
        `* "List out the products in my organization"\n` +
        `* "Give me a financial snapshot for this month"\n\n` +
        `How can I assist your business operations today?`;
    }
    // 7. General Fallback
    else {
      reply = `Hey **${userName}**! I am your StockPilot Copilot.\n\n` +
        `I can help you monitor live inventory, track sales, calculate revenue, check warehouse statuses, or lookup product prices.\n\n` +
        `Feel free to ask me:\n` +
        `* "Which products are low on stock?"\n` +
        `* "Show me today's sales summary"\n` +
        `* "How many active warehouses in my organization?"\n` +
        `* "List out the products in my organization"`;
    }

    return {
      reply: this.sanitizeText(reply),
      actions: executedActions
    };
  }

  getSuggestedPrompts(role = 'ADMIN') {
    return [
      {
        id: 'sales_today',
        label: "Today's Sales & Orders",
        prompt: "Show me today's sales summary and total revenue.",
        icon: 'TrendingUp'
      },
      {
        id: 'low_stock',
        label: 'Low Stock Items',
        prompt: 'Which products are low on stock or out of stock right now?',
        icon: 'AlertTriangle'
      },
      {
        id: 'financial_health',
        label: 'Financial Snapshot',
        prompt: 'Give me a quick financial health check for this month (revenue vs expenses).',
        icon: 'DollarSign'
      },
      {
        id: 'stock_check',
        label: 'Stock Reorder Check',
        prompt: 'What is the current inventory stock status and what needs to be reordered?',
        icon: 'Sparkles'
      }
    ];
  }
}

module.exports = new AiCopilotService();
