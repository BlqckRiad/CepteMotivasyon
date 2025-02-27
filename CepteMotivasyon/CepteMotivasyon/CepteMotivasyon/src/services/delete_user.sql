-- Kullanıcı silme fonksiyonu oluştur
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Önce kullanıcının notlarını sil
  delete from public.notes where user_id = auth.uid();
  
  -- Sonra kullanıcıyı sil
  delete from auth.users where id = auth.uid();
end;
$$;

-- Fonksiyona erişim izni ver
grant execute on function public.delete_user to authenticated;

-- RLS politikası ekle
alter table auth.users enable row level security;

create policy "Users can delete their own account"
  on auth.users
  for delete
  using (id = auth.uid()); 