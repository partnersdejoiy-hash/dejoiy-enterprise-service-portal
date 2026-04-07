type EventPayload = Record<string, unknown>;

type PublishedEvent = {
  eventName: string;
  payload: EventPayload;
  publishedAt: string;
};

export async function publishEvent(
  eventName: string,
  payload: EventPayload
): Promise<PublishedEvent> {
  const event: PublishedEvent = {
    eventName,
    payload,
    publishedAt: new Date().toISOString(),
  };

  /**
   * Development fallback:
   * log events locally so route handlers continue to work
   * even before RabbitMQ/Kafka integration is fully wired.
   */
  if (process.env.NODE_ENV !== "production") {
    console.log("[EVENT_PUBLISHED]", JSON.stringify(event, null, 2));
    return event;
  }

  /**
   * Production placeholder:
   * Replace this block with actual RabbitMQ or Kafka publishing.
   *
   * Example future integrations:
   * - publish to RabbitMQ exchange
   * - publish to Kafka topic
   * - push to AWS SNS/SQS
   */
  console.log("[EVENT_PUBLISHED]", JSON.stringify(event));

  return event;
}
