import { Download, Eye, FileText, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ApplicationDocument } from '@/types';

type Props = {
    documents: ApplicationDocument[];
    onUpload?: (file: File, documentType: string) => void;
    onDelete?: (documentId: number) => void;
    onDownload?: (documentId: number) => void;
    canUpload?: boolean;
    canDelete?: boolean;
    requiredDocuments?: string[];
    className?: string;
};

const getVerificationBadgeColor = (status: string) => {
    const colorMap: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        verified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return colorMap[status] || colorMap.pending;
};

const formatFileSize = (bytes: number): string => {
    if (bytes >= 1073741824) {
        return (bytes / 1073741824).toFixed(2) + ' GB';
    } else if (bytes >= 1048576) {
        return (bytes / 1048576).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    }
    return bytes + ' bytes';
};

export default function DocumentUploadList({
    documents,
    onUpload,
    onDelete,
    onDownload,
    canUpload = false,
    canDelete = false,
    requiredDocuments = [],
    className,
}: Props) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (selectedFile && documentType && onUpload) {
            onUpload(selectedFile, documentType);
            setSelectedFile(null);
            setDocumentType('');
        }
    };

    return (
        <div className={cn('space-y-4', className)}>
            {canUpload && (
                <div className="rounded-lg border p-4 space-y-4">
                    <h3 className="font-medium">Upload Document</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="document-type">Document Type</Label>
                            <Input
                                id="document-type"
                                placeholder="e.g., Birth Certificate"
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file-upload">File</Label>
                            <Input
                                id="file-upload"
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || !documentType}
                    >
                        <Upload className="mr-2 size-4" />
                        Upload Document
                    </Button>
                </div>
            )}

            {documents.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                    <FileText className="mx-auto size-12 mb-2 opacity-50" />
                    <p>No documents uploaded yet</p>
                </div>
            ) : (
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Document Type</TableHead>
                                <TableHead>File Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Uploaded</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                        {doc.document_type}
                                    </TableCell>
                                    <TableCell>{doc.file_name}</TableCell>
                                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                                    <TableCell>
                                        <Badge className={getVerificationBadgeColor(doc.verification_status)}>
                                            {doc.verification_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {onDownload && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDownload(doc.id)}
                                                >
                                                    <Download className="size-4" />
                                                </Button>
                                            )}
                                            {canDelete && onDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(doc.id)}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

