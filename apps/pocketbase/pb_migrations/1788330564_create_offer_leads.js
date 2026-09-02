/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": "@request.auth.role = 'admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text5620481793",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text1839472056",
        "name": "first_name",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 80,
        "min": 1,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text2738491056",
        "name": "last_name",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 80,
        "min": 1,
        "pattern": ""
      },
      {
        "exceptDomains": [],
        "hidden": false,
        "id": "email6203948175",
        "name": "email",
        "onlyDomains": [],
        "presentable": true,
        "required": true,
        "system": false,
        "type": "email"
      },
      {
        "hidden": false,
        "id": "text7318492056",
        "name": "phone",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 30,
        "min": 8,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "bool4920183765",
        "name": "marketing_consent",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "date8392017465",
        "name": "marketing_consent_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date",
        "max": "",
        "min": ""
      },
      {
        "hidden": false,
        "id": "text9482017365",
        "name": "consent_version",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 80,
        "min": 1,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text1092837465",
        "name": "source",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 120,
        "min": 1,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text6574839201",
        "name": "offer_key",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 120,
        "min": 1,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "autodate5839201",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate6748392",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_7842051639",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_offer_leads_email` ON `offer_leads` (`email`)"
    ],
    "listRule": "@request.auth.role = 'admin'",
    "name": "offer_leads",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = 'admin'",
    "viewRule": "@request.auth.role = 'admin'"
  });

  return app.save(collection);
}, (app) => {
  try {
    return app.delete(app.findCollectionByNameOrId("pbc_7842051639"));
  } catch (error) {
    if (error.message.includes("no rows in result set")) return;
    throw error;
  }
});
