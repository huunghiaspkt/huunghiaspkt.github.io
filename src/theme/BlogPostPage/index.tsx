import React, {useEffect, useState} from 'react';
import BlogPostPage from '@theme-original/BlogPostPage';
import type BlogPostPageType from '@theme/BlogPostPage';
import type {WrapperProps} from '@docusaurus/types';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Giscus from '@giscus/react';

type Props = WrapperProps<typeof BlogPostPageType>;

// This block renders as a sibling of <BlogPostPage>, i.e. outside the theme's
// ColorModeProvider, so useColorMode() is unavailable here. Read the current
// theme straight from the <html data-theme> attribute instead, and follow the
// site's light/dark toggle with a MutationObserver.
function GiscusInner(): React.JSX.Element {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const el = document.documentElement;
    const read = () =>
      setTheme(el.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, {attributes: true, attributeFilter: ['data-theme']});
    return () => obs.disconnect();
  }, []);

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
        theme={theme}
        lang="en"
        loading="lazy"
      />
    </div>
  );
}

function GiscusComments(): React.JSX.Element {
  return <BrowserOnly>{() => <GiscusInner />}</BrowserOnly>;
}

export default function BlogPostPageWrapper(props: Props): React.JSX.Element {
  return (
    <>
      <BlogPostPage {...props} />
      <GiscusComments />
    </>
  );
}
