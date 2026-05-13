import React from 'react';
import BlogPostPage from '@theme-original/BlogPostPage';
import type BlogPostPageType from '@theme/BlogPostPage';
import type {WrapperProps} from '@docusaurus/types';
import Giscus from '@giscus/react';
import {useColorMode} from '@docusaurus/theme-common';

type Props = WrapperProps<typeof BlogPostPageType>;

function GiscusComments() {
  const {colorMode} = useColorMode();
  return (
    <div style={{maxWidth: 860, margin: '2rem auto', padding: '0 1.5rem'}}>
      <Giscus
        repo="huunghiaspkt/my-branding"
        repoId="REPO_ID"
        category="General"
        categoryId="CATEGORY_ID"
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={colorMode === 'dark' ? 'dark' : 'light'}
        lang="en"
        loading="lazy"
      />
    </div>
  );
}

export default function BlogPostPageWrapper(props: Props): JSX.Element {
  return (
    <>
      <BlogPostPage {...props} />
      <GiscusComments />
    </>
  );
}
