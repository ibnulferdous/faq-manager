import { json, redirect } from "@remix-run/node";
import { useNavigation, useSubmit } from "@remix-run/react";
import {
  BlockStack,
  Card,
  Layout,
  Page,
  PageActions,
  TextField,
} from "@shopify/polaris";
import React, { useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { saveToShopMetafields } from "./metafields.server";

// Action Function
export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  const dbResponse = await prisma.bundle.create({ data });

  // if bundle creation is successfully, add it to the metafields
  if (dbResponse?.id) {
    const adminData = await saveToShopMetafields(admin, session);
  }

  return redirect(`/app`);
}

export default function CreateBundlePage() {
  const [formState, setFormState] = useState({ title: "", description: "" });
  const [cleanFormState, setCleanFormState] = useState(formState);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving = nav.state === "submitting";

  const submit = useSubmit();

  // handle form submit
  function handleSave() {
    setCleanFormState({ ...formState });
    submit(formState, { method: "post" });
  }

  return (
    <Page
      backAction={{ content: "Home", url: "/app" }}
      title="Create new bundle"
      narrowWidth
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="500">
                <TextField
                  id="title"
                  label="Bundle Title"
                  autoComplete="on"
                  value={formState.title}
                  onChange={(title) => setFormState({ ...formState, title })}
                />
                <TextField
                  id="description"
                  label="Bundle Description"
                  autoComplete="on"
                  multiline={4}
                  value={formState.description}
                  onChange={(description) =>
                    setFormState({ ...formState, description })
                  }
                />
              </BlockStack>
              <PageActions
                primaryAction={{
                  content: "Save",
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
