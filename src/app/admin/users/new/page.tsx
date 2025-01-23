import Link from "next/link"

import { Button } from "@/components/ui/button"

import { UserForm } from "./_components/user-form"

export default function NewBooksPage() {
  return (
    <>
      <Button className="back-btn" asChild>
        <Link href="/admin/users">Go Back</Link>
      </Button>

      <section className="w-full max-w-2xl">
        <UserForm />
      </section>
    </>
  )
}
