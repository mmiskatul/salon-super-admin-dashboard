import { redirect } from 'next/navigation';
import { publicLegalUrl } from '@/lib/api/legal';

// The public terms of service is served by the API at /legal/terms-of-service and edited under Legal pages in this
// console; it is the one copy the website, both apps and Play Console link to.
export default function Page() {
  redirect(publicLegalUrl('terms-of-service'));
}
