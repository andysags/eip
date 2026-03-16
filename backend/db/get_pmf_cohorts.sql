-- Fonction RPC pour générer les cohortes PMF directement dans Supabase.
-- À exécuter dans le "SQL Editor" de Supabase.

CREATE OR REPLACE FUNCTION get_pmf_cohorts_v1()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    now_date timestamptz := now();
    start_of_current_week timestamptz;
    num_weeks int := 12;
    res jsonb := '{"cohorts": []}'::jsonb;
    week_start timestamptz;
    week_end timestamptz;
    w int;
    acquired_count int;
    clicker_count int;
    pct int;
    val_array jsonb;
    arr_json jsonb;
BEGIN
    -- Obtenir le début de la semaine courante (Lundi, 00:00:00)
    start_of_current_week := date_trunc('week', now_date);

    arr_json := '[]'::jsonb;

    FOR w IN 0..(num_weeks - 1) LOOP
        -- w=0 -> semaine courante, w=1 -> semaine précédente...
        week_start := start_of_current_week - (w || ' weeks')::interval;
        week_end := week_start + '1 week'::interval;

        -- Nombre total de profils créés cette semaine
        SELECT COUNT(id) INTO acquired_count
        FROM public.profiles
        WHERE created_at >= week_start AND created_at < week_end;

        pct := NULL;

        IF acquired_count > 0 THEN
            -- Nombre de ces utilisateurs qui ont cliqué sur au moins un produit (existant dans product_clicks)
            SELECT COUNT(DISTINCT id) INTO clicker_count
            FROM public.profiles p
            WHERE p.created_at >= week_start AND p.created_at < week_end
              AND EXISTS (
                  SELECT 1 FROM public.product_clicks pc WHERE pc.user_id = p.id
              );
            
            pct := round((clicker_count::numeric / acquired_count::numeric) * 100);
        END IF;

        -- Générer le tableau des valeurs (valeurs jusqu'à la date actuelle, puis null)
        -- En gros, la colonne 1 contient le pct, et les num_weeks-1 autres colonnes contiennent null pour la structure.
        val_array := '[]'::jsonb;
        FOR i IN 1..(num_weeks - w) LOOP
            IF i = 1 THEN
                IF pct IS NULL THEN
                    val_array := val_array || 'null'::jsonb;
                ELSE
                    val_array := val_array || to_jsonb(pct);
                END IF;
            ELSE
                val_array := val_array || 'null'::jsonb;
            END IF;
        END LOOP;

        -- Construire l'objet de cohorte
        arr_json := arr_json || jsonb_build_object(
            'week', 'Semaine ' || lpad((w + 1)::text, 2, '0'),
            'acquired', acquired_count,
            'weekStart', week_start,
            'values', val_array
        );
    END LOOP;

    RETURN jsonb_build_object('cohorts', arr_json);
END;
$$;
