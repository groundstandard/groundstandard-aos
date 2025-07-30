import { CustomFieldsManagement } from "@/components/admin/CustomFieldsManagement";
import { BackButton } from "@/components/ui/BackButton";

export default function CustomFields() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        <CustomFieldsManagement />
      </div>
    </div>
  );
}