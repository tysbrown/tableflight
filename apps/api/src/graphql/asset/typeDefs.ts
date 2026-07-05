const assetTypeDefs = `#graphql
"""An image in the user's asset library; \`url\` serves the bytes."""
type Asset {
  id: ID!
  name: String!
  url: String!
  mime: String!
  width: Int!
  height: Int!
  createdAt: String!
}

type Query {
  """The signed-in user's asset library, newest first."""
  myAssets: [Asset!]!
}

type Mutation {
  """Stage a base64 data-URL image in the user's library."""
  uploadAsset(name: String!, dataUrl: String!, width: Int!, height: Int!): Asset!
  deleteAsset(id: ID!): Asset!
}
`

export default assetTypeDefs
