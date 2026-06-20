

# მომხმარებლის ავტორიზაციის სისტემა — Google Auth + პროფილი

## მიმოხილვა
დავამატებთ Google ავტორიზაციას Lovable Cloud-ის გამოყენებით, profiles ცხრილით მომხმარებლის მონაცემების შესანახად, ავტორიზაციის გვერდით და Header-ში მომხმარებლის სტატუსის ჩვენებით. ორენოვანი (KA/EN) მხარდაჭერა.

## გეგმა

### 1. Lovable Cloud-ის ჩართვა
- გავააქტიურებთ Lovable Cloud-ს პროექტზე (Supabase backend)
- Google OAuth პროვაიდერის კონფიგურაცია

### 2. მონაცემთა ბაზა — profiles ცხრილი
- შევქმნით `profiles` ცხრილს: `id (uuid, FK → auth.users)`, `full_name`, `phone`, `avatar_url`, `created_at`
- RLS პოლიტიკები: მომხმარებელს შეუძლია მხოლოდ საკუთარი პროფილის წაკითხვა/განახლება
- Trigger: ახალი მომხმარებლის რეგისტრაციისას ავტომატურად შეიქმნება პროფილი

### 3. Supabase კლიენტის დაყენება
- `src/integrations/supabase/client.ts` — Supabase კლიენტი
- `src/integrations/supabase/types.ts` — TypeScript ტიპები

### 4. Auth Context
- `src/context/AuthContext.tsx` — ავტორიზაციის state management
- `onAuthStateChange` listener + `getSession`
- Google sign-in / sign-out ფუნქციები

### 5. ავტორიზაციის გვერდი
- `src/pages/Auth.tsx` — Google-ით შესვლის ღილაკი
- ორენოვანი ტექსტები
- წარმატებული ავტორიზაციის შემდეგ redirect მთავარ გვერდზე

### 6. Header-ის განახლება
- შესული მომხმარებლის ავატარი და სახელი
- "შესვლა" ღილაკის ნაცვლად — პროფილის მენიუ (გამოსვლა)
- მობილურ მენიუშიც ანალოგიური ცვლილება

### 7. თარგმანების დამატება
- ახალი ტექსტები: "Google-ით შესვლა", "გამოსვლა", "პროფილი", "ჩემი ანგარიში"

### 8. Route-ის დამატება
- `/auth` route App.tsx-ში
- LanguageProvider და CartProvider wrapping

## ტექნიკური დეტალები
- **Cloud**: Lovable Cloud (Supabase) Google OAuth
- **DB**: profiles ცხრილი + trigger + RLS
- **Frontend**: AuthContext → useAuth hook, Auth page, Header update
- **ფაილები**: ~6 ახალი/შეცვლილი ფაილი

