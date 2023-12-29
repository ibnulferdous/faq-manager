import {
  BlockStack,
  Card,
  Layout,
  Page,
  PageActions,
  Text,
  TextField,
} from "@shopify/polaris";
import prisma from "../db.server";
import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { saveToShopMetafields } from "../metafields.server";

// Loader function
export async function loader({ request, params }) {
  const bundle = await prisma.bundle.findUnique({
    where: {
      id: params.id,
    },
  });

  return json(bundle);
}

// Action function
export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const data = {
    ...Object.fromEntries(await request.formData()),
    bundleId: params.id,
  };

  const dbResponse = await prisma.faq.create({ data });

  // Sync metafields if successfully deleted from db
  if (dbResponse?.id) {
    const adminData = await saveToShopMetafields(admin, session);
  }

  return redirect(`/app/bundles/${params.id}`);
}

export default function AddNewFaqPage() {
  const bundle = useLoaderData();

  const [formState, setFormState] = useState({ title: "", description: "" });
  const [cleanFormState, setCleanFormState] = useState(formState);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving = nav.state === "submitting";

  const submit = useSubmit();

  // Save form data
  function handleSave() {
    const data = {
      title: formState.title,
      description: formState.description,
    };
    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
    <Page
      backAction={{
        content: `${bundle.title}`,
        url: `/app/bundles/${bundle.id}`,
      }}
      title={`Add FAQ`}
      subtitle={`to "${bundle.title}"`}
      narrowWidth
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card padding="500">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h6">
                  Bundle Title: {bundle.title}
                </Text>
                <Text variant="bodyXs" as="p">
                  Description: {bundle.description}
                </Text>
              </BlockStack>
            </Card>

            {/* New FAQ Form */}
            <Card>
              <BlockStack gap="500">
                <TextField
                  id="title"
                  label="FAQ Title"
                  autoComplete="off"
                  value={formState.title}
                  onChange={(title) => setFormState({ ...formState, title })}
                />
                <TextField
                  id="description"
                  label="FAQ Description"
                  autoComplete="off"
                  multiline={4}
                  value={formState.description}
                  onChange={(description) =>
                    setFormState({ ...formState, description })
                  }
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section>
          <PageActions
            primaryAction={{
              content: "Save",
              loading: isSaving,
              disabled: !isDirty || isSaving,
              onAction: handleSave,
            }}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
