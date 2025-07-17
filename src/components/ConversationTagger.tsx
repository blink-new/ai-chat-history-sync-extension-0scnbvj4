import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Tag, Plus, X, Edit, Palette } from 'lucide-react';
import { ConversationTag } from '../types/premium';
import { PremiumGate } from './PremiumGate';

interface ConversationTaggerProps {
  conversationId: string;
  existingTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export const ConversationTagger: React.FC<ConversationTaggerProps> = ({
  conversationId,
  existingTags,
  onTagsChange
}) => {
  const [allTags, setAllTags] = useState<ConversationTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = () => {
    const stored = localStorage.getItem('ai-sync-tags');
    if (stored) {
      const tags = JSON.parse(stored).map((tag: any) => ({
        ...tag,
        createdAt: new Date(tag.createdAt)
      }));
      setAllTags(tags);
    }
  };

  const saveTags = (tags: ConversationTag[]) => {
    localStorage.setItem('ai-sync-tags', JSON.stringify(tags));
    setAllTags(tags);
  };

  const createTag = () => {
    if (!newTagName.trim()) return;

    const newTag: ConversationTag = {
      id: `tag_${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor,
      createdAt: new Date()
    };

    const updatedTags = [...allTags, newTag];
    saveTags(updatedTags);
    
    // Auto-add the new tag to current conversation
    onTagsChange([...existingTags, newTag.id]);
    
    setNewTagName('');
    setIsCreating(false);
  };

  const toggleTag = (tagId: string) => {
    if (existingTags.includes(tagId)) {
      onTagsChange(existingTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...existingTags, tagId]);
    }
  };

  const deleteTag = (tagId: string) => {
    const updatedTags = allTags.filter(tag => tag.id !== tagId);
    saveTags(updatedTags);
    
    // Remove from current conversation if it was applied
    if (existingTags.includes(tagId)) {
      onTagsChange(existingTags.filter(id => id !== tagId));
    }
  };

  const getTagById = (id: string) => allTags.find(tag => tag.id === id);

  return (
    <PremiumGate feature="Conversation Tagging">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Tag className="h-5 w-5 mr-2" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Applied Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Applied to this conversation</Label>
            <div className="flex flex-wrap gap-2">
              {existingTags.length === 0 ? (
                <p className="text-sm text-gray-500">No tags applied</p>
              ) : (
                existingTags.map(tagId => {
                  const tag = getTagById(tagId);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={tagId}
                      variant="secondary"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => toggleTag(tagId)}
                    >
                      {tag.name}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  );
                })
              )}
            </div>
          </div>

          {/* Available Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Available tags</Label>
            <div className="flex flex-wrap gap-2">
              {allTags
                .filter(tag => !existingTags.includes(tag.id))
                .map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    style={{ borderColor: tag.color, color: tag.color }}
                    className="cursor-pointer hover:bg-opacity-10"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                    <Plus className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
            </div>
          </div>

          {/* Create New Tag */}
          <div className="pt-2 border-t">
            {!isCreating ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Tag
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createTag()}
                />
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Color:</Label>
                  <div className="flex space-x-1">
                    {TAG_COLORS.map(color => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 ${
                          newTagColor === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={createTag} disabled={!newTagName.trim()}>
                    Create
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setNewTagName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Manage Tags */}
          {allTags.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Manage All Tags
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Tags</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allTags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTag(tag.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </PremiumGate>
  );
};