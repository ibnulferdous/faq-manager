import { json, redirect } from "@remix-run/node";
import prisma from "../db.server";
import { useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  BlockStack,
  Card,
  Layout,
  Page,
  PageActions,
  TextField,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { saveToShopMetafields } from "./metafields.server";

export async function loader({ request, params }) {
  const faq = await prisma.faq.findUnique({
    where: { id: params.fid },
  });

  return json(faq);
}

// Action function
export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const data = {
    ...Object.fromEntries(await request.formData()),
  };

  const dbResponse = await prisma.faq.update({
    where: {
      id: data.id,
    },
    data: {
      title: data.title,
      description: data.description,
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

  return redirect(`/app/bundles/${data.bundleId}`);
}

export default function FaqsEditsPage() {
  const faq = useLoaderData();

  const [formState, setFormState] = useState(faq);
  const [cleanFormState, setCleanFormState] = useState(faq);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving = nav.state === "submitting";

  const submit = useSubmit();

  // Save form data
  function handleSave() {
    const data = {
      ...faq,
      title: formState.title,
      description: formState.description,
    };
    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
    <Page
      backAction={{
        content: `Back to collection`,
        url: `/app/bundles/${faq.bundleId}/faqs/${faq.id}`,
      }}
      title={`Edit Product`}
      narrowWidth
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
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
                  label="FAQ description"
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
