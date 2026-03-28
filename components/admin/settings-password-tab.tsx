import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"

type SettingsPasswordTabProps = {
  updatePasswordMock: (formData: FormData) => Promise<void>
  createSubordinateAccount: (formData: FormData) => Promise<void>
  canCreateSubordinateAccount: boolean
}

export function SettingsPasswordTab({
  updatePasswordMock,
  createSubordinateAccount,
  canCreateSubordinateAccount,
}: SettingsPasswordTabProps) {
  return (
    <div className="space-y-4">
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

      {canCreateSubordinateAccount ? (
        <Card>
          <CardHeader>
            <CardTitle>Tạo tài khoản cấp dưới</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createSubordinateAccount} className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="subordinateName">Họ tên</Label>
                <Input id="subordinateName" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subordinateEmail">Email</Label>
                <Input id="subordinateEmail" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subordinateRole">Vai trò</Label>
                <Select id="subordinateRole" name="role" defaultValue="CONTRIBUTOR">
                  <option value="MANAGING_EDITOR">Thư ký biên tập</option>
                  <option value="TEAM_LEAD">Trưởng nhóm</option>
                  <option value="REPORTER_TRANSLATOR">Phóng viên/Biên dịch</option>
                  <option value="CONTRIBUTOR">Cộng tác viên</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subordinatePassword">Mật khẩu khởi tạo</Label>
                <Input id="subordinatePassword" name="password" type="password" minLength={8} required />
              </div>
              <div className="md:col-span-2">
                <PendingSubmitButton type="submit" pendingText="Đang tạo tài khoản...">Tạo tài khoản</PendingSubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
