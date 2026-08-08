/// <reference path="../pb_data/types.d.ts" />

const findAuthRecord = (app, collection, email) => {
  try {
    return app.findAuthRecordByEmail(collection, email);
  } catch (error) {
    if (error.message.includes("no rows in result set")) {
      return null;
    }

    throw error;
  }
};

migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  // Remove accounts generated while the site was being prototyped.
  for (const email of ["admin@example.com", "admin@hotel.com"]) {
    const testAccount = findAuthRecord(app, collection, email);

    if (testAccount) {
      app.delete(testAccount);
    }
  }

  const email = $os.getenv("BOOKING_ADMIN_EMAIL");
  const password = $os.getenv("BOOKING_ADMIN_PASSWORD");

  if (!email || !password) {
    throw new Error(
      "BOOKING_ADMIN_EMAIL and BOOKING_ADMIN_PASSWORD are required",
    );
  }

  let record = findAuthRecord(app, collection, email);

  if (!record) {
    record = new Record(collection);
    record.set("email", email);
  }

  record.setPassword(password);
  record.set("is_admin", true);
  record.set("name", "Raya Boutique Admin");
  record.set("role", "admin");

  return app.save(record);
}, () => {
  // Security cleanup must not recreate prototype administrator accounts.
});
