import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Old address of a task's page (/task/42). "New task" notifications link
 * here, so it forwards to the page inside the Tasks tab.
 */
export default function OldTaskLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/tasks/[id]', params: { id } }} />;
}
