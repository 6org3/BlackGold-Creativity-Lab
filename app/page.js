import CreativityLab from '../components/CreativityLab';

export const dynamic = 'force-dynamic';

export default function Home() {
  return <CreativityLab workflowEnabled={process.env.CONTENT_WORKFLOW_V1 === 'true'} />;
}
