import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"

type SettingsPasswordTabProps = {
  updatePasswordMock: (formData: FormData) => Promise<void>
}

export function SettingsPasswordTab({ updatePasswordMock }: SettingsPasswordTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đổi mật khẩu</CardTitle>
        <CardDescription>Mock UI. Chưa có logic đổi mật khẩu thật ở backend.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updatePasswordMock} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input id="newPassword" name="newPassword" type="password" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required />
          </div>
          <PendingSubmitButton type="submit" pendingText="Đang lưu...">Lưu (mock)</PendingSubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
