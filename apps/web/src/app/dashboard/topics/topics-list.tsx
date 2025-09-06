import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Topic } from '@/lib/topic-types';
import { ChevronRight } from 'lucide-react';
import Link from 'next/dist/client/link';

export default function TopicsList({ topics }: { topics: Topic[] }) {
  return (
    <div className="h-full min-h-0 p-4 rounded-xl border bg-muted/30 overflow-auto flex items-start">
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {topics.length === 0 ? (
          <h1 className="text-gray-500">No topics found.</h1>
        ) : (
          topics.map((topic, index) => (
            <Link href={`/dashboard/topics/${topic.id}`} key={index}>
              <Card className="active:shadow-none h-full items justify-between">
                <CardHeader>
                  <CardTitle>{topic.name}</CardTitle>
                  <CardAction>
                    <ChevronRight className="text-muted-foreground" />
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{topic.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-xs text-gray-500">
                    Created: {new Date(topic.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(topic.updatedAt).toLocaleString()}
                  </p>
                </CardFooter>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
