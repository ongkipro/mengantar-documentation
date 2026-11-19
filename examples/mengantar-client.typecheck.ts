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

// Docs v2: pickup hours are two-digit and run to 20:00.
client.addPickupTime("a", "2026-11-30", "20:00");
// @ts-expect-error "9:00" is rejected by the API since docs v2 (use "09:00")
client.addPickupTime("a", "2026-11-30", "9:00");
// Docs v2: single-courier spx estimate works (sandbox 2026-11-19).
client.estimate({ originId: "o", destinationId: "d", courier: "spx" });
// @ts-expect-error Ninja is discontinued
client.estimate({ originId: "o", destinationId: "d", courier: "Ninja" });
// J&T ECO is an order flag, not a courier value.
client.createOrder({ courier: "JT", pickup: { type: "dropOff", address_id: "a" }, orders: [{ customerAddressDataId: "d", customerAddress: "x", customerName: "n", customerPhone: "081234567890", parcelContent: "p", weight: 1, quantity: 1, goodsValue: 1000, eco: true }] });
