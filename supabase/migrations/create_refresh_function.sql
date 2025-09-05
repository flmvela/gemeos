-- Create the missing refresh_tenant_statistics function
CREATE OR REPLACE FUNCTION refresh_tenant_statistics()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try to refresh the materialized view if it exists
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_statistics;
    EXCEPTION WHEN OTHERS THEN
        -- If concurrent refresh fails, try regular refresh
        BEGIN
            REFRESH MATERIALIZED VIEW tenant_statistics;
        EXCEPTION WHEN OTHERS THEN
            -- If the view doesn't exist, just log and continue
            RAISE NOTICE 'Could not refresh tenant_statistics view: %', SQLERRM;
        END;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_tenant_statistics TO authenticated;