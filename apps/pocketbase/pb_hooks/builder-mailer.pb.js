
/// <reference path="../pb_data/types.d.ts" />
onMailerSend((e) => {
    if (e.app.settings().smtp.enabled) {
        return e.next()
    }

    // Default sender for all system emails (auth, verification, etc.)
    const defaultSender = $os.getenv("BUILDER_MAILER_SENDER_ADDRESS");

    // If a hook explicitly set a custom "from" address (e.g. booking@rayaboutique.eu
    // for booking-related emails), respect it. Hooks that did not override the
    // sender still carry the global meta senderAddress, which falls back to the default.
    const msgFrom = e.message.from?.address;
    const metaSender = e.app.settings().meta.senderAddress;
    const senderAddress = (msgFrom && metaSender && msgFrom !== metaSender)
        ? msgFrom
        : defaultSender;

    const payload = {
        "subject": e.message.subject,
        "content": {
            ...(e.message.html ? {
                "html": e.message.html,
            } : {
                "text": e.message.text,
            }),
            "type": "plain",
        },
        "from": senderAddress,
        "fromName": e.message.from?.name,
        "replyTo": senderAddress,
        "to": e.message.to[0].address,
    }

    const response = $http.send({
        url: `${$os.getenv("BUILDER_MAILER_API_URL")}/api/v2/email`,
        method: "POST",
        headers: {
            "Authorization": `Bearer ${$os.getenv("BUILDER_MAILER_API_KEY")}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (response.statusCode !== 200) {
        $app.logger().error("Failed to send email", "error", response.json);

        throw new ApiError(500, response.json?.message || 'Failed to send email');
    }
})
