# Architecture rules
- Store public chatbot appearance in site_settings and private instructions/knowledge in admin-only bot_settings; save both atomically to prevent leaks and partial updates.
- Run storefront assistant calls in the support-chat edge function through the AI SDK Responses gateway; use AI Elements and in-memory single-session history for the existing widget.