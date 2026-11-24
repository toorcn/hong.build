import { ContentPanel } from '@/components/content-panel';
import { LiveGuestbook } from '@/components/guestbook/live';
export const metadata={title:'Guestbook — memory press'};
export default function Page(){return <ContentPanel title="The memory press" sub="guestbook / press" wide><LiveGuestbook mode="press"/></ContentPanel>}
