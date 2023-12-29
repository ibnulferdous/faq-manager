import prisma from "./db.server";

export async function saveToShopMetafields(admin, session, dbId) {
  const response = await admin.graphql(
    `#graphql
      query {
        shop {
          id
          metafields(first: 10, keys: ["faq_manager.faq_keys"]) {
            edges {
              node {
                id
                namespace
                key
                value
              }
            }
          }
        }
      }`
  );

  const shopData = await response.json();
  const gid = shopData.data.shop.id;
  const metafields = shopData.data.shop.metafields.edges;
  let faq_keys = [];

  if (metafields.length) {
    const faq_keys_value_JSON = metafields[0]?.node?.value;
    const faq_keys_value = JSON.parse(faq_keys_value_JSON);
    const previous_keys = faq_keys_value.faq_keys;
    faq_keys = [...previous_keys];
  }

  // get newly created bundle data from db
  const newBundle = await prisma.bundle.findUnique({
    where: { id: dbId },
    include: {
      faqs: true,
    },
  });

  faq_keys.push(newBundle.id);

  const adminResponse = await admin.graphql(
    `#graphql
        mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              namespace
              key
              id
            }
            userErrors {
              field
              message
              code
            }
          }
        }`,
    {
      variables: {
        metafields: [
          {
            namespace: "faq_manager",
            key: "faq_keys",
            ownerId: gid,
            type: "json",
            value: JSON.stringify({ faq_keys }),
          },
          {
            namespace: "faq_manager",
            key: newBundle.id,
            ownerId: gid,
            type: "json",
            value: JSON.stringify({ bundle: newBundle }),
          },
        ],
      },
    }
  );

  const adminData = await adminResponse.json();

  console.log(adminData);

  return adminData;
}
