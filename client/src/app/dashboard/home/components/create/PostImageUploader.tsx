import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";

import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";

registerPlugin(FilePondPluginImagePreview);

interface PostImageUploadProps {
  onFileSelect: (file: File | null) => void;
}

interface PostImageUploadProps {
  onFileSelect: (file: File | null) => void;
}

export const PostImageUpload = ({ onFileSelect }: PostImageUploadProps) => {
  return (
    <div className="space-y-1">
      <FilePond
        allowMultiple={false}
        acceptedFileTypes={["image/*", "video/*"]}
        labelIdle='<span class="filepond--label-action">Browse</span> or drag & drop'
        onupdatefiles={(fileItems) => {
          onFileSelect((fileItems[0]?.file as File) ?? null);
        }}
        credits={false}
      />
    </div>
  );
};
