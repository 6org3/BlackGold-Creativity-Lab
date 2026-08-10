import LegacyCreativityLab from './LegacyCreativityLab';
import SocialWorkflowLab from './content-workflow/SocialWorkflowLab';

export default function CreativityLab({ workflowEnabled = false }) {
  return workflowEnabled ? <SocialWorkflowLab/> : <LegacyCreativityLab/>;
}
