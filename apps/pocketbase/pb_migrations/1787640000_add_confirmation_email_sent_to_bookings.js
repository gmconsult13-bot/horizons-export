/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('bookings');

  if (collection.fields.getByName('confirmation_email_sent')) {
    return;
  }

  collection.fields.add(new BoolField({
    name: 'confirmation_email_sent',
    required: false,
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId('bookings');
    if (collection.fields.getByName('confirmation_email_sent')) {
      collection.fields.removeByName('confirmation_email_sent');
      return app.save(collection);
    }
  } catch (e) {
    if (e.message.includes('no rows in result set')) return;
    throw e;
  }
});
