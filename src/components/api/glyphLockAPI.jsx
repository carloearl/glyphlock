import { base44 } from '@/api/base44Client';

/**
 * GlyphLock Enterprise API Layer
 * Calls Supabase Edge Functions via Base44 proxy
 */

const callFunction = async (functionName, payload = {}) => {
  try {
    const user = await base44.auth.me();
    
    // Use Base44 proxy to call Supabase functions
    const response = await base44.functions.invoke('supabaseProxy', {
      functionName,
      payload: { ...payload, userId: user.id, userEmail: user.email }
    });

    return response.data;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
};

export const glyphLockAPI = {
  // Health & Status
  healthCheck: async () => {
    return callFunction('health');
  },

  // Usage & Metrics
  usage: {
    getSummary: async () => {
      return callFunction('usageSummary');
    },
    get: async () => {
      return callFunction('getUsageMetrics');
    }
  },

  // Logs & Audit
  logs: {
    list: async (limit = 50, type = 'all') => {
      return callFunction('logsList', { limit, type });
    },
    listRecent: async () => {
      return callFunction('logsList', { limit: 10 });
    },
    listBillingEvents: async (filters = {}) => {
      return callFunction('listBillingEvents', filters);
    }
  },

  // Notifications
  notifications: {
    list: async () => {
      return callFunction('notificationsList');
    },
    markRead: async (notificationId) => {
      // TODO: Implement mark read endpoint
      return { success: true };
    }
  },

  // Security Policies
  security: {
    getPolicies: async () => {
      return callFunction('securityGetPolicies');
    },
    setPolicy: async (policy_key, value) => {
      return callFunction('securitySetPolicy', { policy_key, value });
    },
    runAudit: async () => {
      return callFunction('runSecurityAudit');
    },
    updateSettings: async (settings) => {
      return callFunction('updateSecuritySettings', settings);
    }
  },

  // API Key Management
  keys: {
    list: async () => {
      return callFunction('keysList');
    },
    generate: async (name, environment = 'live') => {
      return callFunction('generateAPIKey', { name, environment });
    },
    rotate: async (keyId) => {
      return callFunction('rotateAPIKey', { keyId });
    },
    update: async (keyId, settings) => {
      return callFunction('updateKeySettings', { keyId, settings });
    },
    delete: async (keyId) => {
      return callFunction('deleteAPIKey', { keyId });
    }
  },

  // API Key Management (Direct calls - no supabaseProxy)
  generateAPIKey: async (name, environment = 'live') => {
    const response = await base44.functions.invoke('generateAPIKey', { name, environment });
    return response.data;
  },

  listAPIKeys: async () => {
    const keys = await base44.entities.APIKey.list('-created_date', 50);
    return { keys };
  },

  rotateAPIKey: async (keyId) => {
    const response = await base44.functions.invoke('rotateAPIKey', { keyId });
    return response.data;
  },

  updateKeySettings: async (keyId, settings) => {
    return callFunction('updateKeySettings', { keyId, settings });
  },

  deleteAPIKey: async (keyId) => {
    return callFunction('deleteAPIKey', { keyId });
  },

  // User Management
  listUsers: async () => {
    return callFunction('listUsers');
  },

  updateUserRole: async (userId, role) => {
    return callFunction('updateUserRole', { userId, role });
  },

  // Logs & Monitoring
  getLogs: async (filter = 'all', limit = 50) => {
    return callFunction('getLogs', { filter, limit });
  },

  getAnalytics: async (timeRange = '7d') => {
    return callFunction('getAnalytics', { timeRange });
  },

  // Functions Management
  functions: {
    list: async () => {
      return callFunction('listFunctions');
    },
    deploy: async (functionData) => {
      return callFunction('deployFunction', functionData);
    }
  },

  // Stripe Payments
  stripe: {
    startCheckout: async (plan) => {
      try {
        // The server resolves the plan to a trusted Stripe Price ID and owns
        // mode, metadata, and return URLs. Browser-controlled price IDs are
        // intentionally not accepted.
        const response = await base44.functions.invoke('stripeCreateCheckout', { plan });
        return { ...response.data, checkoutUrl: response.data.url };
      } catch (error) {
        console.error('Error starting Stripe checkout:', error);
        throw error;
      }
    },
    
    pollPaymentStatus: async (sessionId) => {
      try {
        const response = await base44.functions.invoke('stripePoll', { sessionId });
        return response.data;
      } catch (error) {
        console.error('Error polling payment status:', error);
        throw error;
      }
    }
  },

  // Billing Management
  billing: {
    getStatus: async () => {
      return callFunction('getBillingStatus');
    },
    
    getHistory: async () => {
      return callFunction('getBillingHistory');
    },
    
    adminOverview: async () => {
      return callFunction('getAdminBillingOverview');
    },
    
    updateSubscription: async (priceId) => {
      return callFunction('updateSubscription', { priceId });
    },
    
    cancelSubscription: async () => {
      return callFunction('cancelSubscription');
    },
    
    downloadInvoice: async (invoiceId) => {
      return callFunction('downloadInvoice', { invoiceId });
    },

    sendInvite: async (email, role) => {
      return callFunction('sendTeamInvite', { email, role });
    },

    retryInvoice: async (invoiceId) => {
      return callFunction('retryInvoice', { invoiceId });
    },

    updatePaymentMethod: async (paymentMethodId) => {
      return callFunction('updatePaymentMethod', { paymentMethodId });
    },

    getEvents: async (filters = {}) => {
      return callFunction('getBillingEvents', filters);
    },

    completeOnboarding: async () => {
      return callFunction('completeOnboarding');
    }
  },

  // Team Management
  team: {
    getOrganization: async () => {
      return callFunction('getOrganization');
    },

    listMembers: async () => {
      return callFunction('listTeamMembers');
    },

    updateMemberRole: async (memberId, role) => {
      return callFunction('updateMemberRole', { memberId, role });
    },

    removeMember: async (memberId) => {
      return callFunction('removeMember', { memberId });
    }
  },



  // Support Ticketing
  support: {
    listTickets: async () => {
      return callFunction('listSupportTickets');
    },

    getTicket: async (ticketId) => {
      return callFunction('getSupportTicket', { ticketId });
    },

    createTicket: async (ticketData) => {
      return callFunction('createSupportTicket', ticketData);
    },

    replyToTicket: async (ticketId, message) => {
      return callFunction('replySupportTicket', { ticketId, message });
    }
  },

  // Organization Management
  org: {
    requestDeletion: async (confirmationText) => {
      return callFunction('requestOrgDeletion', { confirmationText });
    }
  }
};

export default glyphLockAPI;