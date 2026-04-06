SELECT
  d.id,
  d.title,
  d.category,
  d.status,
  d.sort_order,
  d.resolved_option_id,
  d.wedding_id,
  d.created_at,

  -- decision_options as JSON array
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id',          opt.id,
          'label',       opt.label,
          'decision_id', opt.decision_id,
          'created_at',  opt.created_at,
          'votes', COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id',         v.id,
                  'user_id',    v.user_id,
                  'rating',     v.rating,
                  'option_id',  v.option_id,
                  'comment',    v.comment,
                  'created_at', v.created_at
                )
                ORDER BY v.created_at
              )
              FROM votes v
              WHERE v.option_id = opt.id
            ),
            '[]'::json
          )
        )
        ORDER BY opt.created_at
      )
      FROM decision_options opt
      WHERE opt.decision_id = d.id
    ),
    '[]'::json
  ) AS decision_options

FROM decisions d
ORDER BY d.sort_order;