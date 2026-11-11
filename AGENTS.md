# Architecture rules
- Define stateful form field components at module scope and pass values/handlers as props to prevent remounts and focus loss while typing.
- Store public chatbot appearance in site_settings and private instructions/knowledge in admin-only bot_settings; save both atomically to prevent leaks and partial updates.
- Run storefront assistant calls in the support-chat edge function through the AI SDK Responses gateway; use AI Elements and in-memory single-session history for the existing widget.
- Send chat photos as validated inline image bytes in session-only history, not public storage URLs, to avoid exposing customer attachments; adapt native Gateway Responses events to the existing AI Elements stream.