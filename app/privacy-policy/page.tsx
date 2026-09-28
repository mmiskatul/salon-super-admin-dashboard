import { redirect } from 'next/navigation';
import { publicLegalUrl } from '@/lib/api/legal';

// The public privacy policy is served by the API at /legal/privacy-policy and edited under Legal pages in this
// console; it is the one copy the website, both apps and Play Console link to.
export default function Page() {
  redirect(publicLegalUrl('privacy-policy'));
}
