import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Download, FileText, File, Image, Database } from 'lucide-react';
import { ExportFormat } from '../types/premium';
import { Conversation } from '../types/conversation';
import { PremiumGate } from './PremiumGate';

interface ExportManagerProps {
  conversations: Conversation[];
  selectedConversations: string[];
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'json',
    name: 'JSON',
    extension: 'json',
    mimeType: 'application/json',
    premium: false
  },
  {
    id: 'pdf',
    name: 'PDF Document',
    extension: 'pdf',
    mimeType: 'application/pdf',
    premium: true
  },
  {
    id: 'markdown',
    name: 'Markdown',
    extension: 'md',
    mimeType: 'text/markdown',
    premium: true
  },
  {
    id: 'html',
    name: 'HTML Report',
    extension: 'html',
    mimeType: 'text/html',
    premium: true
  },
  {
    id: 'csv',
    name: 'CSV Spreadsheet',
    extension: 'csv',
    mimeType: 'text/csv',
    premium: true
  },
  {
    id: 'docx',
    name: 'Word Document',
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    premium: true
  }
];

export const ExportManager: React.FC<ExportManagerProps> = ({
  conversations,
  selectedConversations
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const getFormatIcon = (formatId: string) => {
    switch (formatId) {
      case 'pdf':
      case 'docx':
        return <FileText className="h-4 w-4" />;
      case 'html':
      case 'markdown':
        return <File className="h-4 w-4" />;
      case 'csv':
        return <Database className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const exportToJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-sync-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToMarkdown = (conversations: Conversation[]) => {
    let markdown = '# AI Chat History Export\n\n';
    markdown += `Exported on: ${new Date().toLocaleDateString()}\n\n`;
    
    conversations.forEach(conv => {
      markdown += `## ${conv.title}\n\n`;
      markdown += `**Platform:** ${conv.platform}\n`;
      markdown += `**Date:** ${new Date(conv.createdAt).toLocaleDateString()}\n`;
      markdown += `**Messages:** ${conv.messages.length}\n\n`;
      
      conv.messages.forEach(msg => {
        markdown += `### ${msg.role === 'user' ? 'You' : 'AI'}\n\n`;
        markdown += `${msg.content}\n\n`;
      });
      
      markdown += '---\n\n';
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-sync-export-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToHTML = (conversations: Conversation[]) => {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>AI Chat History Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .conversation { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px; padding: 20px; }
        .message { margin-bottom: 15px; padding: 10px; border-radius: 6px; }
        .user { background-color: #f3f4f6; }
        .assistant { background-color: #eff6ff; }
        .meta { color: #6b7280; font-size: 0.875rem; }
        h1 { color: #1f2937; }
        h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
    </style>
</head>
<body>
    <h1>AI Chat History Export</h1>
    <p class="meta">Exported on: ${new Date().toLocaleDateString()}</p>
`;

    conversations.forEach(conv => {
      html += `
    <div class="conversation">
        <h2>${conv.title}</h2>
        <div class="meta">
            Platform: ${conv.platform} | 
            Date: ${new Date(conv.createdAt).toLocaleDateString()} | 
            Messages: ${conv.messages.length}
        </div>
`;
      
      conv.messages.forEach(msg => {
        html += `
        <div class="message ${msg.role}">
            <strong>${msg.role === 'user' ? 'You' : 'AI'}:</strong>
            <div>${msg.content.replace(/\n/g, '<br>')}</div>
        </div>
`;
      });
      
      html += '    </div>';
    });

    html += `
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-sync-export-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (conversations: Conversation[]) => {
    let csv = 'Conversation Title,Platform,Date,Message Role,Message Content,Message Index\n';
    
    conversations.forEach(conv => {
      conv.messages.forEach((msg, index) => {
        const title = `"${conv.title.replace(/"/g, '""')}"`;
        const content = `"${msg.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        csv += `${title},${conv.platform},${new Date(conv.createdAt).toISOString()},${msg.role},${content},${index}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-sync-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!selectedFormat) return;

    setIsExporting(true);
    setExportProgress(0);

    // Simulate progress for demo
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      const exportData = conversations
        .filter(conv => selectedConversations.includes(conv.id))
        .map(conv => ({
          ...conv,
          metadata: includeMetadata ? {
            platform: conv.platform,
            createdAt: conv.createdAt,
            messageCount: conv.messages.length
          } : undefined,
          tags: includeTags ? conv.tags : undefined
        }));

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (selectedFormat) {
        case 'json':
          exportToJSON(exportData);
          break;
        case 'markdown':
          exportToMarkdown(exportData);
          break;
        case 'html':
          exportToHTML(exportData);
          break;
        case 'csv':
          exportToCSV(exportData);
          break;
        case 'pdf':
        case 'docx':
          // These would require additional libraries in a real implementation
          alert(`${selectedFormat.toUpperCase()} export coming soon!`);
          break;
        default:
          throw new Error('Unsupported format');
      }

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const selectedFormat_obj = EXPORT_FORMATS.find(f => f.id === selectedFormat);
  const canExport = selectedFormat && selectedConversations.length > 0;

  return (
    <PremiumGate feature="Export Formats">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Choose export format" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map(format => (
                  <SelectItem key={format.id} value={format.id}>
                    <div className="flex items-center space-x-2">
                      {getFormatIcon(format.id)}
                      <span>{format.name}</span>
                      {format.premium && (
                        <span className="text-xs text-purple-600 font-medium">PRO</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Export Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
                <Label htmlFor="metadata" className="text-sm">
                  Include metadata (dates, platforms, message counts)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tags"
                  checked={includeTags}
                  onCheckedChange={setIncludeTags}
                />
                <Label htmlFor="tags" className="text-sm">
                  Include conversation tags
                </Label>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            {selectedConversations.length} conversation(s) selected for export
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} />
            </div>
          )}

          <Button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : `Export as ${selectedFormat_obj?.name || 'Selected Format'}`}
          </Button>
        </CardContent>
      </Card>
    </PremiumGate>
  );
};