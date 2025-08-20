'use client';

import { ChevronRight, LibraryBig } from 'lucide-react';
import { topics_data } from '../dummy-topics-data';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import AddTopicDialog, { Topic } from '@/components/add-topic-dialog';
// Using native textarea and crypto.randomUUID(); no external deps needed.

export default function Page() {
  const [topics, setTopics] = useState<Topic[]>(topics_data as Topic[]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>(
    topics_data as Topic[]
  );
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilteredTopics = (value: string) => {
    setSearchTerm(value);
    const term = value.toLowerCase();
    setFilteredTopics(
      topics.filter((t) => t.title.toLowerCase().includes(term))
    );
  };

  const handleAddTopic = (topic: Topic) => {
    setTopics((prev) => [topic, ...prev]);
    setFilteredTopics((prev) => {
      const updated = [topic, ...prev];
      if (!searchTerm.trim()) return updated;
      const term = searchTerm.toLowerCase();
      return updated.filter((t) => t.title.toLowerCase().includes(term));
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 h-full min-h-0">
      <div className="px-6 flex justify-between">
        <div className="flex flex-col">
          <div className="flex">
            <LibraryBig size={32} />
            <h1 className="text-2xl">All Topics</h1>
          </div>
          <span className="text-muted-foreground">
            Parent of one or more notes
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <Input
            type="text"
            placeholder="Search topics..."
            className="border px-2 py-1"
            onChange={(e) => handleFilteredTopics(e.target.value)}
          />
          <AddTopicDialog onAdd={handleAddTopic} />
        </div>
      </div>
      <div className="h-full min-h-0">
        <div className="h-full min-h-0 bg-muted/30 overflow-auto flex items-start">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            {filteredTopics.length === 0 ? (
              <h1 className="text-gray-500">No topics found.</h1>
            ) : (
              filteredTopics.map((topic, index) => (
                <Link href={`/dashboard/topics/${topic.slug}`} key={index}>
                  <Card className="active:shadow-none h-full items justify-between">
                    <CardHeader>
                      <CardTitle>{topic.title}</CardTitle>
                      <CardAction>
                        <ChevronRight className="text-muted-foreground" />
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {topic.description}
                      </p>
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
      </div>
    </div>
  );
}
