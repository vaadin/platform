package com.vaadin.platform.test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class Entity {
    private String name;
    private List<Entity> entities = Collections.emptyList();

    public Entity() {
    }

    public Entity(String name) {
        this.name = name;
    }

    public Entity(String name, Entity... entity) {
        this.name = name;
        this.entities = Arrays.asList(entity);
    }

    public String getName() {
        return name;
    }

    void setName(String name) {
        this.name = name;
    }

    public List<Entity> getEntities() {
        return entities;
    }

    public void setEntities(List<Entity> entities) {
        this.entities = entities;
    }
    
    @Override
    public String toString() {
        return name + " " + String.join(" ", entities.stream().map(Entity::getName).collect(Collectors.toList()));
    }
}
