/// <reference path="../pb_data/types.d.ts" -*-
// Fixes (2026-09-06 live testing): $app.dao() no longer exists in PocketBase
// 0.38 — this cron previously crashed on every run. Converted to the $app.* API.
// Also wraps the job in try/catch so a cron failure never crashes the server.
onBootstrap((e) => {
  // Register a cron job that runs every 30 minutes
  $app.cron().add("cleanup_bookings", "*/30 * * * *", () => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twentyFourHoursAgoISO = twentyFourHoursAgo.toISOString().split('T')[0];
    const todayISO = now.toISOString().split('T')[0];

    try {
      // Query bookings where created_at is more than 24 hours ago AND check_in_date is in the future
      const records = $app.findRecordsByFilter(
        "bookings",
        "created_at < {:createdBefore} && check_in_date > {:today}",
        "",
        0,
        0,
        { createdBefore: twentyFourHoursAgoISO, today: todayISO }
      );

      let deletedCount = 0;
      const deletedDetails = [];

      // Delete each matching booking
      for (const record of records) {
        try {
          $app.delete(record);
          deletedCount++;
          deletedDetails.push({
            id: record.id,
            guest_name: record.get("guest_name"),
            guest_email: record.get("guest_email"),
            check_in_date: record.get("check_in_date"),
            created_at: record.get("created_at")
          });
        } catch (deleteError) {
          $app.logger().error("Failed to delete booking " + record.id, "error", "" + deleteError);
        }
      }

      // Log the results
      $app.logger().info(
        "Booking cleanup completed",
        "deleted_count", deletedCount,
        "execution_time", new Date().toISOString(),
        "deleted_bookings", deletedDetails
      );

    } catch (error) {
      $app.logger().error(
        "Booking cleanup cron job failed",
        "error", "" + error,
        "execution_time", new Date().toISOString()
      );
    }
  });

  e.next();
});
