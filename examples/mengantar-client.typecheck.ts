// Compile-time contract checks for the example client (no runtime, no test framework).
// Included in `make client-check`; each @ts-expect-error must stay an error.
import { MengantarClient } from "./mengantar-client";

declare const client: MengantarClient;

client.simulateOrderStatus({ courier: "JNE", orderId: "O1", statusCategory: "DELIVERED" });
client.simulateOrderStatus({ courier: "spx", trackingId: "SPX1", statusCategory: "RTS" });
// @ts-expect-error Ninja is discontinued and not supported by the simulation route
client.simulateOrderStatus({ courier: "Ninja", orderId: "O1", statusCategory: "DELIVERED" });
// @ts-expect-error exactly one of orderId / trackingId
client.simulateOrderStatus({ courier: "JNE", orderId: "O1", trackingId: "T1", statusCategory: "DELIVERED" });
// @ts-expect-error one of orderId / trackingId is required
client.simulateOrderStatus({ courier: "JNE", statusCategory: "DELIVERED" });
// @ts-expect-error only ON DELIVERY, DELIVERED or RTS
client.simulateOrderStatus({ courier: "JNE", orderId: "O1", statusCategory: "PICKED UP" });

// The README label example must compile: data is returned unwrapped, one orderId per request.
async function labelExample() {
  const req = await client.requestLabelGeneration({ orderId: "ORDER-JNE-001", courier: "JNE", format: "thermal-10x15" });
  const status = await client.getLabelGenerationStatus(req.labelGenerationId);
  if (status.status === "COMPLETED") void status.downloadUrl;
  // @ts-expect-error an array of order ids is not accepted
  await client.requestLabelGeneration({ orderIds: ["a", "b"], courier: "JNE", format: "thermal-10x15" });
}
void labelExample;
