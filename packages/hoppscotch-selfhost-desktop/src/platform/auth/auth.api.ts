import { runMutation } from "@hoppscotch/common/helpers/backend/GQLClient"
import { getClient } from "@tauri-apps/api/http"
import * as E from "fp-ts/Either"
import { z } from "zod"
import {
  UpdateUserDisplayNameDocument,
  UpdateUserDisplayNameMutation,
  UpdateUserDisplayNameMutationVariables,
} from "../../api/generated/graphql"

const expectedAllowedProvidersSchema = z.object({
  // currently supported values are "GOOGLE", "GITHUB", "EMAIL", "MICROSOFT", "SAML"
  // keeping it as string to avoid backend accidentally breaking frontend when adding new providers
  providers: z.array(z.string()),
})

export const getAllowedAuthProviders = async () => {
  try {
    const client = await getClient()
    const res = await client.get(
      `${import.meta.env.VITE_BACKEND_API_URL}/auth/providers`
    )

    const parseResult = expectedAllowedProvidersSchema.safeParse(res.data)

    if (!parseResult.success) {
      return E.left("SOMETHING_WENT_WRONG")
    }

    return E.right(parseResult.data.providers)
  } catch (_) {
    return E.left("SOMETHING_WENT_WRONG")
  }
}

export const updateUserDisplayName = (updatedDisplayName: string) =>
  runMutation<
    UpdateUserDisplayNameMutation,
    UpdateUserDisplayNameMutationVariables,
    ""
  >(UpdateUserDisplayNameDocument, {
    updatedDisplayName,
  })()
