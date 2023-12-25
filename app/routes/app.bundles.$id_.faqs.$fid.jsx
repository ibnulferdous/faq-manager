import prisma from "../db.server";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BlockStack, Card, Layout, Page, Text } from "@shopify/polaris";

// Loader function
export async function loader({ request, params }) {
  const product = await prisma.faq.findUnique({
    where: { id: params.fid },
  });

  return json(product);
}

export default function FaqDetailsPage() {
  const faq = useLoaderData();

  console.log(faq);

  return (
    <Page
      backAction={{
        content: `Back to Bundle`,
        url: `/app/bundles/${faq.bundleId}`,
      }}
      title={`FAQ Details`}
      narrowWidth
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card padding="500">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h6">
                  Title: {faq.title}
                </Text>
                <Text variant="bodyXs" as="p">
                  Description: {faq.description}
                </Text>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
