import { useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import {
  Link,
  Links,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Button,
  EmptyState,
  IndexTable,
  ButtonGroup,
  Tooltip,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { DeleteMajor, EditMajor, ViewMajor } from "@shopify/polaris-icons";
import { saveToShopMetafields } from "../metafields.server";

// Loader function
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  const bundles = await prisma.bundle.findMany({
    where: { shop: session.shop },
  });

  return json(bundles);
};

// Action function
export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);

  const data = {
    ...Object.fromEntries(await request.formData()),
  };

  // Delete a bundle
  const dbResponse = await prisma.bundle.delete({
    where: {
      id: data.id,
    },
  });

  // Sync metafields when deleted from DB
  if (dbResponse?.id) {
    const adminData = await saveToShopMetafields(admin, session);
  }

  return redirect(`/app`);
};

// Make text shorter
function truncate(str, { length = 25 } = {}) {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

// Empty state component
const EmptyBundleState = ({ onAction }) => (
  <EmptyState
    heading="Create FAQ Bundle to group faqs"
    action={{
      content: "Create FAQ Bundle",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>
      Create faqs and bundle them into groups to show in pages, products and
      collects wherever you want
    </p>
  </EmptyState>
);

// Bundle Table Component
const BundleTable = ({ bundles, handleDelete }) => (
  <IndexTable
    resourceName={{
      singular: "Bundle",
      plural: "Bundles",
    }}
    itemCount={bundles.length}
    headings={[
      { title: "Title" },
      { title: "Description" },
      { title: "Action" },
    ]}
    selectable={false}
  >
    {bundles.map((bundle) => (
      <BundleTableRow
        key={bundle.id}
        bundle={bundle}
        ws
        handleDelete={handleDelete}
      />
    ))}
  </IndexTable>
);

// Bundle table row
const BundleTableRow = ({ bundle, handleDelete }) => (
  <IndexTable.Row id={bundle.id} position={bundle.id}>
    <IndexTable.Cell>
      <Link to={`bundles/${bundle.id}`}>
        <Button variant="plain">{truncate(bundle.title)}</Button>
      </Link>
    </IndexTable.Cell>
    <IndexTable.Cell>{truncate(bundle.description)}</IndexTable.Cell>
    <IndexTable.Cell>
      <ButtonGroup>
        <Link to={`bundles/${bundle.id}`}>
          <Tooltip content="View" dismissOnMouseOut>
            <Button icon={ViewMajor}></Button>
          </Tooltip>
        </Link>
        <Link to={`bundles/${bundle.id}/edit`}>
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
            onClick={() => handleDelete(bundle)}
          ></Button>
        </Tooltip>
      </ButtonGroup>
    </IndexTable.Cell>
  </IndexTable.Row>
);

export default function AppIndex() {
  const bundles = useLoaderData();
  const navigate = useNavigate();
  const submit = useSubmit();

  // delete function event handler
  function handleDelete(data) {
    submit(data, { method: "post" });
  }

  return (
    <Page
      primaryAction={{
        content: "Create FAQ Bundle",
        onAction: () => navigate("bundles/new"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {bundles.length == 0 ? (
              <EmptyBundleState onAction={() => navigate("bundles/new")} />
            ) : (
              <BundleTable bundles={bundles} handleDelete={handleDelete} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
