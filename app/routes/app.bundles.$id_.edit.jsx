import {
  BlockStack,
  Card,
  Layout,
  Page,
  PageActions,
  TextField,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit } from "@remix-run/react";
import { useState } from "react";
import { saveToShopMetafields } from "../metafields.server";

// Loader function
export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  const bundle = await prisma.bundle.findUnique({
    where: { id: params.id },
  });

  return json(bundle);
}

// Action function
export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);

  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData()),
  };

  // Update the bundle in DB
  const dbResponse = await prisma.bundle.update({
    where: {
      id: params.id,
    },
    data: {
      ...data,
    },
  });

  // console.log("\n\n\n\n");
  // console.log("Data is: ");
  // console.log(dbResponse);
  // console.log("\n\n\n\n");

  // Sync metafields if successfully deleted from db
  if (dbResponse?.id) {
    const adminData = await saveToShopMetafields(admin, session);
  }

  return redirect(`/app`);
}

export default function BundlesEditPage() {
  const bundle = useLoaderData();
  const [formState, setFormState] = useState(bundle);
  const [cleanFormState, setCleanFormState] = useState(bundle);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigate();
  const isSaving = nav.state == "submitting";

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
      backAction={{ content: "Collections", url: "/app" }}
      title="Edit Collection"
      narrowWidth
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <TextField
                  id="title"
                  label="Collection title"
                  autoComplete="off"
                  value={formState.title}
                  onChange={(title) => setFormState({ ...formState, title })}
                />
                <TextField
                  id="description"
                  label="Collection description"
                  autoComplete="off"
                  multiline={4}
                  value={formState.description}
                  onChange={(description) =>
                    setFormState({ ...formState, description })
                  }
                />
              </BlockStack>

              <PageActions
                primaryAction={{
                  content: "Save Changes",
                  loading: isSaving,
                  disabled: !isDirty || isSaving,
                  onAction: handleSave,
                }}
              />
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
