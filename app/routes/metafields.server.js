import prisma from "../db.server";

export async function saveToShopMetafields(admin, session) {
  const response = await admin.graphql(
    `#graphql
      query {
        shop {
          id
        }
      }`
  );

  const gidData = await response.json();
  const gid = gidData.data.shop.id;

  // get all bundles data from db
  const bundles = await prisma.bundle.findMany({
    where: { shop: session.shop },
    include: {
      faqs: true,
    },
  });

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
            key: "faq_data",
            ownerId: gid,
            type: "json",
            value: JSON.stringify({ bundles: bundles }),
          },
        ],
      },
    }
  );

  const adminData = await adminResponse.json();

  return adminData;
}
