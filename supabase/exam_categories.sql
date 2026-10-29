-- ============================================================
-- Six full 25-question exams, one per anatomy group:
--   bones, muscles, arteries, veins, nerves, internal organs.
--
-- Each paper reuses the 15 questions already stored by
-- supabase/exam_bank.sql (three short papers per group) and adds
-- 10 new multiple-choice questions, so a student sits one
-- 25-question paper per category instead of three 5-question ones.
--
-- Run supabase/schema.sql and supabase/exam_bank.sql first.
-- This file is idempotent: it skips a paper whose title is already
-- in the bank, re-archives the short papers and lifts every paper's
-- pass mark to 80%. The short papers are archived at the end
-- (their questions now live inside the full papers); an admin can
-- republish any of them from /admin.
-- ============================================================

-- Яс
do $$
declare
  e_id bigint;
  source_count int;
begin
  if not exists (select 1 from public.exams where title = 'Яс: 25 асуулттай шалгалт') then
    select count(*) into source_count
    from public.exam_questions q
    join public.exams e on e.id = q.exam_id
    where e.group_key = 'skeletal' and e.part_key <> '';

    if source_count < 15 then
      raise notice 'Skipping %: run supabase/exam_bank.sql first.', 'Яс: 25 асуулттай шалгалт';
    else
      insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status, group_key, part_key, part_mn, source)
        values ('Яс: 25 асуулттай шалгалт', 'Bones: 25-question exam', 'Яс', 'basic', 40, 80, 'published', 'skeletal', '', '', 'ai')
        returning id into e_id;

      -- Reuse the 15 questions from the group's three short papers.
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points)
      select e_id, src.rn::int, src.kind, src.prompt, src.prompt_en, src.options, src.answer, src.rubric, src.concept, src.points
      from (
        select q.*, row_number() over (order by q.exam_id, q.position) as rn
        from public.exam_questions q
        join public.exams e on e.id = q.exam_id
        where e.group_key = 'skeletal' and e.part_key <> ''
      ) src
      where src.rn <= 15;

      -- Ten new questions bring the paper to 25 questions (50 points).
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
        (e_id, 16, 'mcq', 'Шилбэний ясны (tibia) урд талын дээд хэсэгт байрлах, өвдөгний шөрмөс (ligamentum patellae) бэхлэгддэг товгорыг юу гэж нэрлэдэг вэ?', 'What is the bony prominence on the anterior proximal tibia where the patellar ligament attaches?', '["Дотор талын шагай (Medial malleolus)","Шилбэний товгор (Tibial tuberosity)","Шилбэний урд ирмэг (Anterior border)","Гадна талын булцуу (Lateral condyle)"]', 1, 'Шилбэний ясны урд талын товгор нь өвдөгний шөрмөсний бэхлэгдэх газар гэдгийг мэдэх.', 'tibia', 2),
        (e_id, 17, 'mcq', 'Тохойн ясны (ulna) проксимал төгсгөлд байрлах, тохойн ар талын цухуйлтыг үүсгэдэг бүтцийг нэрлэнэ үү.', 'Which structure at the proximal end of the ulna forms the point of the elbow?', '["Coronoid process","Radial notch","Olecranon","Styloid process"]', 2, 'Olecranon нь ulna-ийн проксимал төгсгөлийн ар талын цухуйлт.', 'ulna', 2),
        (e_id, 18, 'mcq', 'Radius ба ulna-ийн хооронд сунах, хоёр ясыг холбож, шууны тогтвортой байдлыг хангадаг мембраныг юу гэж нэрлэдэг вэ?', 'What membrane stretches between the radius and ulna and stabilizes the forearm?', '["Interosseous membrane","Annular ligament","Radiocarpal ligament","Bicipital aponeurosis"]', 0, 'Radius, ulna-г холбодог interosseous membrane-ийг таних.', 'radius', 2),
        (e_id, 19, 'mcq', 'Эгэмний яс (clavicle) ихэвчлэн аль хэсэгтээ хугардаг вэ?', 'Which part of the clavicle is most commonly fractured?', '["Дотор гуравны нэг (Medial third)","Гадна гуравны нэг (Lateral third)","Acromial төгсгөл (Acromial end)","Дунд гуравны нэг (Middle third)"]', 3, 'Clavicle-ийн дунд гуравны нэг хамгийн түгээмэл хугардаг.', 'clavicle', 2),
        (e_id, 20, 'mcq', 'Patella ямар төрлийн яс вэ?', 'What type of bone is the patella?', '["Хавтгай яс (Flat bone)","Sesamoid яс","Жигд бус яс (Irregular bone)","Урт яс (Long bone)"]', 1, 'Patella нь quadriceps шөрмөсний дотор хөгждөг хамгийн том sesamoid яс.', 'patella', 2),
        (e_id, 21, 'mcq', 'Sternum-ийн manubrium ба body-ийн хоорондох үе (sternal angle) аль түвшинд байрладаг вэ?', 'At which level is the sternal angle, the joint between the manubrium and body of the sternum?', '["C7","T2/T3","T4/T5","L1"]', 2, 'Sternal angle нь T4/T5 түвшинд байрлаж, хоёр дахь хавирганы мөгөөрсний бэхлэлтийн тэмдэг.', 'sternum', 2),
        (e_id, 22, 'mcq', 'Аль хавирга нь урд талдаа мөгөөрсөөр холбогдохгүйгээр чөлөөтэй төгсдөг вэ?', 'Which ribs are free-floating anteriorly, without attaching to the sternum?', '["11-12","1-2","3-6","7-10"]', 0, '11, 12-р хавирга нь floating ribs бөгөөд урд талдаа чөлөөтэй төгсдөг.', 'rib', 2),
        (e_id, 23, 'mcq', 'Доод эрүүний ясны (mandible) body ба ramus-ыг холбодог буланг юу гэж нэрлэдэг вэ?', 'What is the angle called where the body and ramus of the mandible meet?', '["Mental protuberance","Coronoid process","Condylar process","Angle of mandible"]', 3, 'Mandible-ийн body, ramus-ын уулзвар нь angle of mandible.', 'mandible', 2),
        (e_id, 24, 'mcq', 'Sacrum нь хэдэн нугаламын нийлэлтээс үүсдэг вэ?', 'How many vertebrae fuse to form the sacrum?', '["3","4","5","7"]', 2, 'Sacrum нь 5 sacral vertebra-ийн нийлэлтээс үүсдэг.', 'sacrum', 2),
        (e_id, 25, 'mcq', 'Умайн хүзүүний нугалам (cervical vertebra)-ийн transverse process дотор байрлах нүхийг юу гэж нэрлэдэг вэ?', 'What is the opening within the transverse process of a cervical vertebra called?', '["Vertebral foramen","Transverse foramen","Intervertebral foramen","Obturator foramen"]', 1, 'Cervical vertebra-ийн transverse foramen-аар vertebral artery дамждаг.', 'cervical vertebra', 2);
    end if;
  end if;
end;
$$;

-- Булчин
do $$
declare
  e_id bigint;
  source_count int;
begin
  if not exists (select 1 from public.exams where title = 'Булчин: 25 асуулттай шалгалт') then
    select count(*) into source_count
    from public.exam_questions q
    join public.exams e on e.id = q.exam_id
    where e.group_key = 'muscular' and e.part_key <> '';

    if source_count < 15 then
      raise notice 'Skipping %: run supabase/exam_bank.sql first.', 'Булчин: 25 асуулттай шалгалт';
    else
      insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status, group_key, part_key, part_mn, source)
        values ('Булчин: 25 асуулттай шалгалт', 'Muscles: 25-question exam', 'Булчин', 'basic', 40, 80, 'published', 'muscular', '', '', 'ai')
        returning id into e_id;

      -- Reuse the 15 questions from the group's three short papers.
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points)
      select e_id, src.rn::int, src.kind, src.prompt, src.prompt_en, src.options, src.answer, src.rubric, src.concept, src.points
      from (
        select q.*, row_number() over (order by q.exam_id, q.position) as rn
        from public.exam_questions q
        join public.exams e on e.id = q.exam_id
        where e.group_key = 'muscular' and e.part_key <> ''
      ) src
      where src.rn <= 15;

      -- Ten new questions bring the paper to 25 questions (50 points).
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
        (e_id, 16, 'mcq', 'Triceps brachii булчингийн үндсэн үүрэг юу вэ?', 'What is the primary action of the triceps brachii?', '["Тохойг нугалах (Elbow flexion)","Мөрний abduction","Тохойг тэнийлгэх (Elbow extension)","Шууны supination"]', 2, 'Triceps brachii нь тохойг тэнийлгэдэг.', 'triceps brachii', 2),
        (e_id, 17, 'mcq', 'Тохойг нугалах үндсэн (хамгийн хүчтэй) булчин аль вэ?', 'Which muscle is the primary flexor of the elbow?', '["Biceps brachii","Brachialis","Brachioradialis","Pronator teres"]', 1, 'Brachialis нь тохойн үеийг нугалах гол булчин.', 'brachialis', 2),
        (e_id, 18, 'mcq', 'Brachioradialis булчингийн үйлдэл аль вэ?', 'What is the action of the brachioradialis?', '["Тохойг тэнийлгэх (Elbow extension)","Шууны pronation","Хурууны нугалалт","Тохойг нугалах (Elbow flexion)"]', 3, 'Brachioradialis нь тохойг нугалахад оролцдог.', 'brachioradialis', 2),
        (e_id, 19, 'mcq', 'Sternocleidomastoid булчин хоёр талаараа агших үед ямар үйлдэл гүйцэтгэдэг вэ?', 'When both sternocleidomastoid muscles contract together, what movement do they produce?', '["Хүзүүг урагш нугалах (Neck flexion)","Хүзүүг хойш тэнийлгэх (Neck extension)","Хүзүүг хажуу тийш хазайлгах","Мөрний өргөлт"]', 0, 'Хоёр талын sternocleidomastoid агшилт нь хүзүүг урагш нугалах.', 'sternocleidomastoid', 2),
        (e_id, 20, 'mcq', 'Supraspinatus булчин мөрний үений аль хөдөлгөөнийг эхлүүлдэг вэ?', 'Which shoulder movement does the supraspinatus initiate?', '["Adduction (Дотогш татах)","Abduction (Гадагш өргөх)","Lateral rotation","Medial rotation"]', 1, 'Supraspinatus нь мөрний abduction-ийг эхний 15 градуст эхлүүлдэг.', 'supraspinatus', 2),
        (e_id, 21, 'mcq', 'Infraspinatus булчингийн үндсэн үйлдэл юу вэ?', 'What is the primary action of the infraspinatus?', '["Мөрний дотогш эргэлт (Medial rotation)","Мөрний abduction","Мөрний гадагш эргэлт (Lateral rotation)","Мөрний adduction"]', 2, 'Infraspinatus нь rotator cuff-ийн гишүүн бөгөөд мөрийг гадагш эргүүлдэг.', 'infraspinatus', 2),
        (e_id, 22, 'mcq', 'Subscapularis булчингийн үндсэн үйлдэл юу вэ?', 'What is the primary action of the subscapularis?', '["Мөрний дотогш эргэлт (Medial rotation)","Мөрний гадагш эргэлт","Мөрний abduction","Тохойн тэнийлт"]', 0, 'Subscapularis нь мөрийг дотогш эргүүлдэг rotator cuff булчин.', 'subscapularis', 2),
        (e_id, 23, 'mcq', 'Pectoralis major булчингийн үндсэн үйлдэл аль вэ?', 'What is a primary action of the pectoralis major?', '["Мөрний abduction ба гадагш эргэлт","Тохойн тэнийлт","Шууны supination","Мөрний adduction ба дотогш эргэлт"]', 3, 'Pectoralis major нь мөрийг дотогш татаж, дотогш эргүүлдэг.', 'pectoralis major', 2),
        (e_id, 24, 'mcq', 'Gastrocnemius булчингийн үндсэн үйлдэл юу вэ?', 'What is the primary action of the gastrocnemius?', '["Шагайг дээшээ нугалах (Dorsiflexion)","Өвдгийг тэнийлгэх","Шагайг ул руугаа нугалах (Plantar flexion)","Хөлийн хурууг татах"]', 2, 'Gastrocnemius нь plantar flexion-ийг гүйцэтгэдэг.', 'gastrocnemius', 2),
        (e_id, 25, 'mcq', 'Tibialis anterior булчингийн үндсэн үйлдэл юу вэ?', 'What is the primary action of the tibialis anterior?', '["Шагайг ул руу нугалах (Plantar flexion)","Шагайг дээш нугалах (Dorsiflexion)","Өвдгийг нугалах","Хөлийн гадагш эргэлт"]', 1, 'Tibialis anterior нь dorsiflexion ба inversion-д оролцдог.', 'tibialis anterior', 2);
    end if;
  end if;
end;
$$;

-- Артерийн судас
do $$
declare
  e_id bigint;
  source_count int;
begin
  if not exists (select 1 from public.exams where title = 'Артерийн судас: 25 асуулттай шалгалт') then
    select count(*) into source_count
    from public.exam_questions q
    join public.exams e on e.id = q.exam_id
    where e.group_key = 'arterial' and e.part_key <> '';

    if source_count < 15 then
      raise notice 'Skipping %: run supabase/exam_bank.sql first.', 'Артерийн судас: 25 асуулттай шалгалт';
    else
      insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status, group_key, part_key, part_mn, source)
        values ('Артерийн судас: 25 асуулттай шалгалт', 'Arteries: 25-question exam', 'Артерийн судас', 'basic', 40, 80, 'published', 'arterial', '', '', 'ai')
        returning id into e_id;

      -- Reuse the 15 questions from the group's three short papers.
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points)
      select e_id, src.rn::int, src.kind, src.prompt, src.prompt_en, src.options, src.answer, src.rubric, src.concept, src.points
      from (
        select q.*, row_number() over (order by q.exam_id, q.position) as rn
        from public.exam_questions q
        join public.exams e on e.id = q.exam_id
        where e.group_key = 'arterial' and e.part_key <> ''
      ) src
      where src.rn <= 15;

      -- Ten new questions bring the paper to 25 questions (50 points).
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
        (e_id, 16, 'mcq', 'Бугалганы артери (brachial artery) нь тохойн хөндийд ямар хоёр артерид хуваагддаг вэ?', 'Into which two arteries does the brachial artery divide in the cubital fossa?', '["Femoral ба popliteal artery","Common carotid ба vertebral artery","Axillary ба subclavian artery","Radial ба ulnar artery"]', 3, 'Brachial artery нь cubital fossa-д radial, ulnar artery-д хуваагдана.', 'brachial artery', 2),
        (e_id, 17, 'mcq', 'Radial artery-ийн импульсийг хаана илрүүлдэг вэ?', 'Where is the radial artery pulse commonly palpated?', '["Шууны гадна тал, radius-ийн styloid process-ийн ойролцоо","Тохойн дотор тал","Хүзүүний хажуу","Шагайны ар тал"]', 0, 'Radial pulse нь шууны гадна талд, radius-ийн алслагдсан төгсгөлийн ойролцоо тэмдэглэгддэг.', 'radial artery', 2),
        (e_id, 18, 'mcq', 'Ulnar artery нь шууны аль талаар дамжин гарны алга руу ордог вэ?', 'On which side of the forearm does the ulnar artery travel to reach the palm?', '["Гадна (lateral) тал","Ар тал","Дотор (medial) тал","Урд талын дунд"]', 2, 'Ulnar artery нь шууны дотор талаар явж, superficial palmar arch-д оролцдог.', 'ulnar artery', 2),
        (e_id, 19, 'mcq', 'Axillary artery нь аль булчингийн доод ирмэгээс brachial artery болж үргэлжилдэг вэ?', 'The axillary artery continues as the brachial artery at the lower border of which muscle?', '["Pectoralis minor","Teres major","Deltoid","Latissimus dorsi"]', 1, 'Axillary artery нь teres major-ийн доод ирмэгт brachial artery болно.', 'axillary artery', 2),
        (e_id, 20, 'mcq', 'Subclavian artery нь аль хавирганы гадна ирмэг дээр axillary artery болж нэрээ өөрчилдөг вэ?', 'At the outer border of which rib does the subclavian artery become the axillary artery?', '["1-р хавирга","2-р хавирга","3-р хавирга","4-р хавирга"]', 0, 'Subclavian artery нь 1-р хавирганы гадна ирмэгт axillary artery болно.', 'subclavian artery', 2),
        (e_id, 21, 'mcq', 'Common carotid artery нь хүзүүнд ямар түвшинд internal ба external carotid artery-д хуваагддаг вэ?', 'At which level does the common carotid artery bifurcate into the internal and external carotid arteries?', '["C7 түвшин","T1 түвшин","Mandible-ийн булан","C4 түвшин (thyroid cartilage-ийн дээд ирмэг)"]', 3, 'Common carotid нь C4 түвшинд (thyroid cartilage-ийн дээд ирмэг) салаална.', 'common carotid artery', 2),
        (e_id, 22, 'mcq', 'Vertebral artery нь cervical vertebra-ийн аль бүтцээр дамжин явдаг вэ?', 'Through which structure of the cervical vertebrae does the vertebral artery pass?', '["Vertebral foramen","Intervertebral foramen","Transverse foramen","Sacral foramen"]', 2, 'Vertebral artery нь C1-C6 transverse foramen-аар дамждаг.', 'vertebral artery', 2),
        (e_id, 23, 'mcq', 'Зүрхний булчингийг цусаар хангадаг артериудыг ерөнхийд нь юу гэж нэрлэдэг вэ?', 'What are the arteries that supply the heart muscle called?', '["Pulmonary arteries","Coronary arteries","Carotid arteries","Renal arteries"]', 1, 'Coronary arteries нь миокардыг цусаар хангана.', 'coronary artery', 2),
        (e_id, 24, 'mcq', 'Popliteal artery нь өвдөгний арын хэсгээс доош ямар хоёр артерид хуваагддаг вэ?', 'Into which two arteries does the popliteal artery divide below the knee?', '["Anterior ба posterior tibial artery","Radial ба ulnar artery","Femoral ба deep femoral artery","Renal ба hepatic artery"]', 0, 'Popliteal artery нь anterior, posterior tibial artery-д хуваагдана.', 'popliteal artery', 2),
        (e_id, 25, 'mcq', 'Бөөрийг цусаар хангадаг renal artery нь хэвлийн аортоос аль түвшинд салдаг вэ?', 'At which level does the renal artery branch from the abdominal aorta?', '["T12","L4","S1","L1-L2"]', 3, 'Renal artery нь L1-L2 түвшинд abdominal aorta-с салдаг.', 'renal artery', 2);
    end if;
  end if;
end;
$$;

-- Венийн судас
do $$
declare
  e_id bigint;
  source_count int;
begin
  if not exists (select 1 from public.exams where title = 'Венийн судас: 25 асуулттай шалгалт') then
    select count(*) into source_count
    from public.exam_questions q
    join public.exams e on e.id = q.exam_id
    where e.group_key = 'venous' and e.part_key <> '';

    if source_count < 15 then
      raise notice 'Skipping %: run supabase/exam_bank.sql first.', 'Венийн судас: 25 асуулттай шалгалт';
    else
      insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status, group_key, part_key, part_mn, source)
        values ('Венийн судас: 25 асуулттай шалгалт', 'Veins: 25-question exam', 'Венийн судас', 'basic', 40, 80, 'published', 'venous', '', '', 'ai')
        returning id into e_id;

      -- Reuse the 15 questions from the group's three short papers.
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points)
      select e_id, src.rn::int, src.kind, src.prompt, src.prompt_en, src.options, src.answer, src.rubric, src.concept, src.points
      from (
        select q.*, row_number() over (order by q.exam_id, q.position) as rn
        from public.exam_questions q
        join public.exams e on e.id = q.exam_id
        where e.group_key = 'venous' and e.part_key <> ''
      ) src
      where src.rn <= 15;

      -- Ten new questions bring the paper to 25 questions (50 points).
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
        (e_id, 16, 'mcq', 'Доод хөндий вен (inferior vena cava) нь цусыг ямар хөндий рүү цутгадаг вэ?', 'Into which chamber does the inferior vena cava empty?', '["Зүүн тосгуур","Баруун тосгуур","Баруун ховдол","Зүүн ховдол"]', 1, 'IVC нь баруун тосгуурт цус цутгана.', 'inferior vena cava', 2),
        (e_id, 17, 'mcq', 'Уушигны вен (pulmonary vein) ямар цусыг зүрхэнд буцааж авчирдаг вэ?', 'What kind of blood do the pulmonary veins carry back to the heart?', '["Хүчилтөрөгчөөр баялаг цус","Хүчилтөрөгч багатай цус","Холимог цус","Цусны эсгүй плазм"]', 0, 'Pulmonary veins нь хүчилтөрөгчөөр баялаг цусыг зүүн тосгуурт авчирна.', 'pulmonary vein', 2),
        (e_id, 18, 'mcq', 'Internal jugular vein нь subclavian vein-тэй нийлж ямар вен үүсгэдэг вэ?', 'The internal jugular vein joins the subclavian vein to form which vein?', '["Superior vena cava","Cephalic vein","Brachiocephalic vein","Azygos vein"]', 2, 'Internal jugular ба subclavian vein нь brachiocephalic vein үүсгэдэг.', 'internal jugular vein', 2),
        (e_id, 19, 'mcq', 'Subclavian vein нь аль венийн үргэлжлэл вэ?', 'The subclavian vein is the continuation of which vein?', '["Brachial vein","Cephalic vein","Internal jugular vein","Axillary vein"]', 3, 'Axillary vein нь 1-р хавирганы түвшинд subclavian vein болж үргэлжилнэ.', 'subclavian vein', 2),
        (e_id, 20, 'mcq', 'Cephalic vein нь гарын аль талаар явдаг вэ?', 'On which side of the upper limb does the cephalic vein run?', '["Дотор (medial) тал","Гадна (lateral) тал","Ар талын дунд","Урд талын дунд"]', 1, 'Cephalic vein нь гарын гадна талаар явна.', 'cephalic vein', 2),
        (e_id, 21, 'mcq', 'Basilic vein нь гарын аль талаар явж, brachial vein-тэй нийлдэг вэ?', 'On which side of the upper limb does the basilic vein run before joining the brachial veins?', '["Дотор (medial) тал","Гадна (lateral) тал","Урд тал","Ар тал"]', 0, 'Basilic vein нь гарын дотор талаар явна.', 'basilic vein', 2),
        (e_id, 22, 'mcq', 'Small saphenous vein нь хаанаас эхэлж, ямар вен рүү цус цутгадаг вэ?', 'Where does the small saphenous vein originate and into which vein does it drain?', '["Хөлийн дотор ирмэгээс эхэлж, femoral vein руу","Шагайны ар талаас эхэлж, great saphenous vein руу","Хөлийн гадна ирмэгээс эхэлж, popliteal vein руу","Өвдөгнөөс эхэлж, iliac vein руу"]', 2, 'Small saphenous vein нь хөлийн гадна талаас эхэлж, popliteal vein-д цус цутгана.', 'small saphenous vein', 2),
        (e_id, 23, 'mcq', 'Femoral vein нь цавины шөрмөсний доор гарсны дараа ямар вен болж үргэлжилдэг вэ?', 'After passing under the inguinal ligament, the femoral vein continues as which vein?', '["External iliac vein","Internal iliac vein","Great saphenous vein","Popliteal vein"]', 0, 'Femoral vein нь inguinal ligament-ийн доор external iliac vein болно.', 'femoral vein', 2),
        (e_id, 24, 'mcq', 'Элэгнээс цусыг шууд аваачиж, доод хөндий вен рүү цутгадаг венүүдийг юу гэж нэрлэдэг вэ?', 'Which veins drain blood from the liver directly into the inferior vena cava?', '["Portal vein","Splenic vein","Renal veins","Hepatic veins"]', 3, 'Hepatic veins нь элэгнээс IVC руу цус цутгана.', 'hepatic vein', 2),
        (e_id, 25, 'mcq', 'Azygos vein нь цээжний хөндийн ар талын венүүдийг цуглуулж, ямар вен рүү цус цутгадаг вэ?', 'The azygos vein drains the posterior thoracic wall and empties into which vein?', '["Inferior vena cava","Superior vena cava","Pulmonary vein","Brachiocephalic vein"]', 1, 'Azygos vein нь SVC руу цус цутгана.', 'azygos vein', 2);
    end if;
  end if;
end;
$$;

-- Мэдрэлийн систем
do $$
declare
  e_id bigint;
  source_count int;
begin
  if not exists (select 1 from public.exams where title = 'Мэдрэлийн систем: 25 асуулттай шалгалт') then
    select count(*) into source_count
    from public.exam_questions q
    join public.exams e on e.id = q.exam_id
    where e.group_key = 'nervous' and e.part_key <> '';

    if source_count < 15 then
      raise notice 'Skipping %: run supabase/exam_bank.sql first.', 'Мэдрэлийн систем: 25 асуулттай шалгалт';
    else
      insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status, group_key, part_key, part_mn, source)
        values ('Мэдрэлийн систем: 25 асуулттай шалгалт', 'Nervous system: 25-question exam', 'Мэдрэлийн систем', 'basic', 40, 80, 'published', 'nervous', '', '', 'ai')
        returning id into e_id;

      -- Reuse the 15 questions from the group's three short papers.
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points)
      select e_id, src.rn::int, src.kind, src.prompt, src.prompt_en, src.options, src.answer, src.rubric, src.concept, src.points
      from (
        select q.*, row_number() over (order by q.exam_id, q.position) as rn
        from public.exam_questions q
        join public.exams e on e.id = q.exam_id
        where e.group_key = 'nervous' and e.part_key <> ''
      ) src
      where src.rn <= 15;

      -- Ten new questions bring the paper to 25 questions (50 points).
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
        (e_id, 16, 'mcq', 'Тархины аль хэсэг нь тэнцвэр, хөдөлгөөний зохицуулалтад гол үүрэг гүйцэтгэдэг вэ?', 'Which part of the brain is primarily responsible for balance and coordination of movement?', '["Cerebrum","Medulla oblongata","Cerebellum","Thalamus"]', 2, 'Cerebellum нь тэнцвэр, хөдөлгөөний зохицуулалтыг хариуцна.', 'brain', 2),
        (e_id, 17, 'mcq', 'Насанд хүрэгчдийн нугас (spinal cord) ихэвчлэн аль нугаламын түвшинд төгсдөг вэ?', 'At which vertebral level does the adult spinal cord typically end?', '["L1-L2","C7","T12","S1"]', 0, 'Spinal cord нь conus medullaris-аар L1-L2 түвшинд төгсдөг.', 'spinal cord', 2),
        (e_id, 18, 'mcq', 'Trochlear nerve (CN IV) аль булчинг мэдрэлжүүлдэг вэ?', 'Which muscle does the trochlear nerve (CN IV) innervate?', '["Superior rectus","Lateral rectus","Medial rectus","Superior oblique"]', 3, 'CN IV нь superior oblique булчинг мэдрэлжүүлнэ.', 'trochlear nerve', 2),
        (e_id, 19, 'mcq', 'Ulnar nerve нь тохойн дотор талын ясны цухуйлтын ар талаар дамжихдаа цохиход ямар мэдрэмж үүсгэдэг вэ?', 'When the ulnar nerve passes behind the medial epicondyle, what sensation is felt if it is struck?', '["Хөл унах","Цахилгаан мэт шагах мэдрэмж (funny bone)","Нүүрний саажилт","Харааны бүдэгрэл"]', 1, 'Ulnar nerve нь medial epicondyle-ийн ар талаар дамждаг тул цохиход мэдрэгддэг.', 'ulnar nerve', 2),
        (e_id, 20, 'mcq', 'Radial nerve-ийн гэмтлийн үед ямар шинж тэмдэг илрэх вэ?', 'What clinical sign is typical of radial nerve injury?', '["Claw hand","Foot drop","Wrist drop (сарвуу унах)","Facial palsy"]', 2, 'Radial nerve гэмтэхэд wrist drop үүсдэг.', 'radial nerve', 2),
        (e_id, 21, 'mcq', 'Musculocutaneous nerve нь аль булчинг мэдрэлжүүлдэг вэ?', 'Which muscle does the musculocutaneous nerve innervate?', '["Biceps brachii","Triceps brachii","Deltoid","Pronator teres"]', 0, 'Musculocutaneous nerve нь biceps brachii, brachialis-ийг мэдрэлжүүлнэ.', 'musculocutaneous nerve', 2),
        (e_id, 22, 'mcq', 'Axillary nerve нь бугалганы ясны аль хэсгийн хугаралтад хамгийн их өртөмтгий вэ?', 'Axillary nerve injury is most associated with a fracture of which part of the humerus?', '["Mid-shaft","Surgical neck","Medial epicondyle","Olecranon fossa"]', 1, 'Axillary nerve нь surgical neck-ийн хугаралтад өртөж, deltoid-ийн саажилт үүсгэдэг.', 'axillary nerve', 2),
        (e_id, 23, 'mcq', 'Tibial nerve нь шилбэний арын хэсгийн булчингуудыг мэдрэлжүүлж, ямар үйлдлийг гүйцэтгэхэд тусалдаг вэ?', 'The tibial nerve innervates the posterior leg muscles and assists which movement?', '["Dorsiflexion","Knee extension","Hip abduction","Plantar flexion"]', 3, 'Tibial nerve нь plantar flexion-ийг гүйцэтгэх булчингуудыг мэдрэлжүүлнэ.', 'tibial nerve', 2),
        (e_id, 24, 'mcq', 'Common fibular nerve-ийн гэмтлийн улмаас ямар шинж тэмдэг илрэх вэ?', 'What sign results from common fibular nerve injury?', '["Foot drop (хөл унах)","Wrist drop","Claw hand","Pes cavus"]', 0, 'Common fibular nerve гэмтэхэд dorsiflexion алдагдаж foot drop үүсдэг.', 'common fibular nerve', 2),
        (e_id, 25, 'mcq', 'Femoral nerve нь аль булчингийн бүлгийг мэдрэлжүүлдэг вэ?', 'Which muscle group does the femoral nerve innervate?', '["Арын гуяны булчингууд (hamstrings)","Дотор гуяны булчингууд (adductors)","Урд гуяны булчингууд (quadriceps)","Шилбэний урд булчингууд"]', 2, 'Femoral nerve нь урд гуяны quadriceps бүлгийг мэдрэлжүүлнэ.', 'femoral nerve', 2);
    end if;
  end if;
end;
$$;

-- Дотор эрхтэн
do $$
declare
  e_id bigint;
  source_count int;
begin
  if not exists (select 1 from public.exams where title = 'Дотор эрхтэн: 25 асуулттай шалгалт') then
    select count(*) into source_count
    from public.exam_questions q
    join public.exams e on e.id = q.exam_id
    where e.group_key = 'cardiac' and e.part_key <> '';

    if source_count < 15 then
      raise notice 'Skipping %: run supabase/exam_bank.sql first.', 'Дотор эрхтэн: 25 асуулттай шалгалт';
    else
      insert into public.exams (title, title_en, topic, level, time_limit_min, pass_pct, status, group_key, part_key, part_mn, source)
        values ('Дотор эрхтэн: 25 асуулттай шалгалт', 'Internal organs: 25-question exam', 'Дотор эрхтэн', 'basic', 40, 80, 'published', 'organs', '', '', 'ai')
        returning id into e_id;

      -- Reuse the 15 questions from the group's three short papers.
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points)
      select e_id, src.rn::int, src.kind, src.prompt, src.prompt_en, src.options, src.answer, src.rubric, src.concept, src.points
      from (
        select q.*, row_number() over (order by q.exam_id, q.position) as rn
        from public.exam_questions q
        join public.exams e on e.id = q.exam_id
        where e.group_key = 'cardiac' and e.part_key <> ''
      ) src
      where src.rn <= 15;

      -- Ten new questions bring the paper to 25 questions (50 points).
      insert into public.exam_questions (exam_id, position, kind, prompt, prompt_en, options, answer, rubric, concept, points) values
        (e_id, 16, 'mcq', 'Баруун уушиг хэдэн дэлбээтэй вэ?', 'How many lobes does the right lung have?', '["2","3","4","5"]', 1, 'Баруун уушиг 3 дэлбээтэй, зүүн уушиг 2 дэлбээтэй.', 'lung', 2),
        (e_id, 17, 'mcq', 'Trachea нь ямар түвшинд баруун, зүүн гол гуурсан хоолой (main bronchus) болж салаалдаг вэ?', 'At which level does the trachea bifurcate into the right and left main bronchi?', '["C6","T10","T4/T5 (sternal angle)","L1"]', 2, 'Trachea нь sternal angle-ийн түвшинд (T4/T5) салаална.', 'trachea', 2),
        (e_id, 18, 'mcq', 'Улаан хоолой (esophagus) нь диафрагмыг ямар түвшинд нэвтэрдэг вэ?', 'At which vertebral level does the esophagus pass through the diaphragm?', '["T10","T4","T8","T12"]', 0, 'Esophagus нь T10 түвшинд diaphragmatic hiatus-аар дамждаг.', 'esophagus', 2),
        (e_id, 19, 'mcq', 'Ходоодны (stomach) улаан хоолойтой холбогддог хэсгийг юу гэж нэрлэдэг вэ?', 'What is the part of the stomach that connects to the esophagus called?', '["Fundus","Pylorus","Body","Cardia"]', 3, 'Cardia нь stomach-ийн esophagus-той холбогдох хэсэг.', 'stomach', 2),
        (e_id, 20, 'mcq', 'Элэгний (liver) аль гадаргуу нь диафрагмтай ойрхон байрладаг вэ?', 'Which surface of the liver lies against the diaphragm?', '["Дотоод эрхтний гадаргуу (Visceral surface)","Диафрагмлаг гадаргуу (Diaphragmatic surface)","Арын гадаргуу","Доод гадаргуу"]', 1, 'Liver-ийн diaphragmatic surface нь diaphragm-тай ойрхон.', 'liver', 2),
        (e_id, 21, 'mcq', 'Pancreas-ийн аль хэсэг нь spleen-ийн ойролцоо байрладаг вэ?', 'Which part of the pancreas lies near the spleen?', '["Head","Body","Tail","Uncinate process"]', 2, 'Pancreas-ийн tail нь spleen-ийн ойролцоо байрладаг.', 'pancreas', 2),
        (e_id, 22, 'mcq', 'Spleen нь хэвлийн аль хэсэгт байрладаг вэ?', 'In which abdominal quadrant is the spleen located?', '["Зүүн дээд (Left upper quadrant)","Баруун дээд","Зүүн доод","Баруун доод"]', 0, 'Spleen нь left upper quadrant-д байрладаг.', 'spleen', 2),
        (e_id, 23, 'mcq', 'Бөөр (kidney) нь хэвлийн хөндийн ар талд ямар байрлалтай байдаг вэ?', 'The kidneys are located in which position relative to the peritoneum?', '["Intraperitoneal","Subperitoneal","Peritoneal","Retroperitoneal"]', 3, 'Kidneys нь retroperitoneal байрлалтай.', 'kidney', 2),
        (e_id, 24, 'mcq', 'Шээсний давсаг (urinary bladder) нь ямар булчингийн давхаргаар шээсийг гадагшлуулах үйлдэл гүйцэтгэдэг вэ?', 'Which muscle layer of the urinary bladder contracts to expel urine?', '["External oblique","Detrusor muscle","External anal sphincter","Diaphragm"]', 1, 'Detrusor muscle нь bladder-ийг агшиж шээсийг гадагшлуулна.', 'urinary bladder', 2),
        (e_id, 25, 'mcq', 'Нарийн гэдэсний (small intestine) аль хэсэг нь ходоодтой шууд холбогддог вэ?', 'Which part of the small intestine connects directly to the stomach?', '["Jejunum","Ileum","Duodenum","Cecum"]', 2, 'Duodenum нь stomach-ийн pylorus-той холбогддог.', 'small intestine', 2);
    end if;
  end if;
end;
$$;

-- The short structure papers stay in the bank for admins, but students
-- now see the six full category exams instead of eighteen 5-question ones.
update public.exams
set status = 'archived'
where status = 'published'
  and part_key <> ''
  and group_key in ('skeletal', 'muscular', 'arterial', 'venous', 'nervous', 'cardiac');

-- Every block above only inserts a paper whose title is still missing, so a
-- database seeded while the pass mark was 70% keeps those rows forever. Set the
-- school-wide pass mark on each run instead.
update public.exams
set pass_pct = 80
where pass_pct <> 80;
