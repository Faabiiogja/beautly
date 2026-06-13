import { resetDb } from "@/test/db";
import { beforeEach, describe, expect, it } from "vitest";
import { createProfessional } from "./professional-service";
import {
  createService,
  listActiveServices,
  listServices,
  setServiceActive,
  updateService,
} from "./service-catalog";

let businessId: string;

beforeEach(async () => {
  await resetDb();
  const result = await createProfessional({
    businessName: "Maria Nails",
    slug: "maria-nails",
    contactPhone: "11999999999",
    email: "maria@beautly.com",
    password: "senha123",
    startActive: true,
  });
  businessId = result.businessId;
});

describe("service-catalog", () => {
  it("creates and lists a service", async () => {
    const service = await createService(businessId, {
      name: "Manicure",
      price: 30,
      durationMinutes: 40,
    });
    expect(service.active).toBe(true);
    expect(await listServices(businessId)).toHaveLength(1);
  });

  it("edits a service", async () => {
    const service = await createService(businessId, {
      name: "Manicure",
      price: 30,
      durationMinutes: 40,
    });
    await updateService(businessId, service.id, {
      name: "Manicure Premium",
      price: 45,
      durationMinutes: 50,
    });
    const all = await listServices(businessId);
    expect(all[0]).toMatchObject({
      name: "Manicure Premium",
      price: 45,
      durationMinutes: 50,
    });
  });

  it("inactivating hides from active list but keeps it in full list", async () => {
    const service = await createService(businessId, {
      name: "Manicure",
      price: 30,
      durationMinutes: 40,
    });
    await setServiceActive(businessId, service.id, false);
    expect(await listActiveServices(businessId)).toHaveLength(0);
    expect(await listServices(businessId)).toHaveLength(1);
  });

  it("does not edit a service from another business", async () => {
    const other = await createProfessional({
      businessName: "Ana",
      slug: "ana",
      contactPhone: "1",
      email: "ana@x.com",
      password: "senha123",
      startActive: true,
    });
    const service = await createService(other.businessId, {
      name: "X",
      price: 10,
      durationMinutes: 20,
    });
    await expect(
      updateService(businessId, service.id, {
        name: "Hack",
        price: 1,
        durationMinutes: 1,
      }),
    ).rejects.toThrow();
  });
});
