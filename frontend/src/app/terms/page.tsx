import React from 'react';
import { Metadata } from 'next';
import styles from './page.module.css';

interface PageData {
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_tags: string | null;
  created_at: string;
  updated_at: string;
}

async function getPageData(): Promise<PageData | null> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3022';
    const res = await fetch(`${backendUrl}/api/admin/content/pages/public/terms`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Error fetching terms page content:', err);
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPageData();
  if (data) {
    return {
      title: data.meta_title || data.title,
      description: data.meta_description || undefined,
      keywords: data.meta_tags || undefined,
      alternates: {
        canonical: '/terms',
      },
    };
  }
  return {
    title: 'Terms of Use | Gamesato',
    alternates: {
      canonical: '/terms',
    },
  };
}

export default async function TermsPage() {
  const pageData = await getPageData();

  if (pageData) {
    const formattedDate = new Date(pageData.updated_at || pageData.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });

    return (
      <div className={styles.container}>
        <h1 className={styles.title}>
          {pageData.title || 'Terms of Use'}
        </h1>
        <p className={styles.updatedAt}>
          Last updated on {formattedDate}
        </p>
        
        <hr className={styles.divider} />

        <div 
          className={styles.contentBody}
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      </div>
    );
  }

  // Fallback to static version
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Terms of Use
      </h1>
      <p className={styles.updatedAt}>
        Last updated on 1/12/2021
      </p>
      
      <hr className={styles.divider} />

      <div className={styles.contentBody}>
        <div>
          <p>
            Welcome to the Gamesato website (the &quot;Website&quot;). These Terms of Service (These &quot;Terms&quot;) are concluded between Maxflow BV, a company incorporated under Belgian law, having its registered office at Philipssite 5 bus 001, 3001 Leuven, Belgium, registered under company registration number 0804.839.227 under trade name &quot;Gamesato&quot; (&quot;Gamesato&quot;, &quot;we&quot;, &quot;us&quot;) and the User (&quot;User&quot;, &quot;you&quot; or &quot;your&quot;) (together, the &quot;Parties&quot;). Gamesato provides you access to the Website. A User is a person who visits the Website and/or the Platform, plays web games, registers via any form available on the Website, or otherwise subscribes or enters into a contract with Gamesato.
          </p>
        </div>

        <div>
          <p>
            THESE TERMS OUTLINE OUR RELATIONSHIP WITH YOU, AS SUPPLEMENTED BY OUR PRIVACY AND COOKIE POLICY. BY ACCESSING OR OTHERWISE USING THE WEBSITE OR PLATFORM, YOU AGREE TO BE BOUND BY THE FOLLOWING TERMS AND CONDITIONS AND APPLICABLE LAWS AND REGULATIONS.
          </p>
        </div>

        <div>
          <p>
            The Platform is intended for visitors and users who are thirteen (13) years of age (or the applicable minimum age in your country) or older. If you are under thirteen (13) years of age (or the applicable minimum age in your country) through our Platform. However, we may offer specific games suitable for younger children below the applicable minimum age, https://kids.Gamesato.com/ (&quot;Kids Site&quot;) and have a separate privacy policy applicable to the Kids Site at kids.Gamesato.com/privacy-policy. Gamesato does not allow personalised advertising on its Kids Site.
          </p>
        </div>

        <div>
          <p>
            Your use of the Website and/or the Platform means that you are aware of, and agree to, the most recent version of the Terms available on the Website. It is your sole responsibility to ensure that your use of any and all third party websites or content complies with their respective terms of use. We may modify these Terms from time to time. We will notify you of any material changes by email (if you are registered with us) or by posting a notice on the Website (where deemed necessary) and will note the date of the last change. If you use the Website or Platform after such change, you will be deemed to have accepted these changes and agree to be bound by them. These Terms will continue to apply until terminated in accordance with the Terms.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2>1. Acceptable Use</h2>
          <p>
            You agree to use Gamesato strictly for personal, non-commercial entertainment purposes. Reverse engineering, scraping, or launching automated attacks on our servers is strictly prohibited.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2>2. Intellectual Property</h2>
          <p>
            All game titles, trademarks, brand logos, graphics, and code packages on Gamesato are owned by Gamesato or licensed from respective H5 game developers.
          </p>
        </div>

        <div className={styles.sectionBlock}>
          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials. Gamesato reserves the right to terminate accounts that violate platform policies.
          </p>
        </div>
      </div>
    </div>
  );
}
