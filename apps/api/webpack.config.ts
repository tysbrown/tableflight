import { composePlugins, withNx } from '@nx/webpack'
import { mergeWithRules } from 'webpack-merge'

export default composePlugins(withNx(), (config) => {
  const webpackConfig = {
    module: {
      rules: [
        {
          test: /\.(graphql|gql)$/,
          loader: 'graphql-tag/loader',
          exclude: /node_modules/,
        },
      ],
    },
  }

  return mergeWithRules({
    module: {
      rules: {
        test: 'match',
        use: {
          loader: 'match',
          options: 'replace',
        },
      },
    },
  })(config, webpackConfig)
})
