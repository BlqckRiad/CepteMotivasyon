-- Profildeki tamamlanan görev sayısını güncelle (4 gün x 5 görev = 20 görev)
UPDATE "public"."profiles" 
SET 
    "completed_tasks" = "completed_tasks" + 20,
    "user_streak" = 4,
    "last_streak_date" = '2024-03-16'
WHERE "id" = '4c846cb1-1ec9-43be-943f-2fddd494eefb'; 