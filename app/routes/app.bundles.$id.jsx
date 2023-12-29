import { json, redirect } from "@remix-run/node";
import prisma from "../db.server";
import {
  Link,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  BlockStack,
  Button,
  ButtonGroup,
  Card,
  EmptyState,
  IndexTable,
  Layout,
  Page,
  Text,
  Tooltip,
} from "@shopify/polaris";
import { DeleteMajor, EditMajor, ViewMajor } from "@shopify/polaris-icons";
import { saveToShopMetafields } from "../metafields.server";
import { authenticate } from "../shopify.server";

// Loader function
export async function loader({ request, params }) {
  const bundle = await prisma.bundle.findUnique({
    where: { id: params.id },
    include: {
      faqs: true,
    },
  });

  return json(bundle);
}

// Action function
export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);

  const data = {
    ...Object.fromEntries(await request.formData()),
  };

  const dbResponse = await prisma.faq.delete({
    where: {
      id: data.id,
    },
  });

  console.log("\n\n\n\n");
  console.log(`Form Data: `);
  console.log(dbResponse);
  console.log("\n\n\n\n");

  // Sync metafields if successfully deleted from db
  if (dbResponse?.id) {
    const adminData = await saveToShopMetafields(admin, session);
  }

  return redirect(`/app/bundles/${params.id}`);
}

// Make text shorter
function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

// Empty state component
const EmptyFaqState = ({ onAction }) => (
  <EmptyState
    heading="Add faq to bundle"
    action={{
      content: "Add FAQ",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>
      Add faqs and bundle them into groups to show in pages, products and
      collects wherever you want
    </p>
  </EmptyState>
);

// FAQ Table
const FaqTable = ({ faqs, handleDelete }) => (
  <>
    <IndexTable
      resourceName={{
        singular: "FAQ",
        plural: "FAQs",
      }}
      itemCount={faqs.length}
      headings={[
        { title: "Title" },
        { title: "Description" },
        { title: "Action" },
      ]}
      selectable={false}
    >
      {faqs.map((faq) => (
        <FaqTableRow key={faq.id} faq={faq} handleDelete={handleDelete} />
      ))}
    </IndexTable>
  </>
);

// FAQ table row
const FaqTableRow = ({ faq, handleDelete }) => (
  <>
    <IndexTable.Row id={faq.id} position={faq.id}>
      <IndexTable.Cell>
        <Link to={`faqs/${faq.id}`}>
          <Button variant="plain">{truncate(faq.title)}</Button>
        </Link>
      </IndexTable.Cell>
      <IndexTable.Cell>{truncate(faq.description)}</IndexTable.Cell>
      <IndexTable.Cell>
        <ButtonGroup>
          <Link to={`faqs/${faq.id}`}>
            <Tooltip content="View" dismissOnMouseOut>
              <Button icon={ViewMajor}></Button>
            </Tooltip>
          </Link>

          <Link to={`faqs/${faq.id}/edit`}>
            <Tooltip content="Edit" dismissOnMouseOut>
              <Button icon={EditMajor}></Button>
            </Tooltip>
          </Link>

          <Tooltip content="Delete" dismissOnMouseOut>
            <Button
              variant="primary"
              tone="critical"
              destructive="true"
              icon={DeleteMajor}
              onClick={() => handleDelete(faq)}
            ></Button>
          </Tooltip>
        </ButtonGroup>
      </IndexTable.Cell>
    </IndexTable.Row>
  </>
);

export default function BundlesPage() {
  const bundle = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();

  // Save form data
  function handleDelete(data) {
    submit(data, { method: "post" });
  }

  return (
    <Page
      title="Bundle Details"
      backAction={{ content: "Faq Manager", url: "/app" }}
      primaryAction={{
        content: "Add Faq",
        url: `faqs/new`,
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card padding="500">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h6">
                  Name: {bundle.title}
                </Text>
                <Text variant="bodyXs" as="p">
                  Description: {bundle.description}
                </Text>
              </BlockStack>
            </Card>

            <Card padding="0">
              {bundle.faqs.length === 0 ? (
                <EmptyFaqState onAction={() => navigate(`faqs/new`)} />
              ) : (
                <FaqTable faqs={bundle.faqs} handleDelete={handleDelete} />
              )}
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
